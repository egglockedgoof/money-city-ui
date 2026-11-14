import ARKit

/// Eyes: ARKit world tracking. On LiDAR devices, raw scene depth
/// (min/max/mean sampled off the depth map), raw feature points and
/// the light estimate. Degrades to feature points + light elsewhere.
final class DepthSensors: NSObject, ARSessionDelegate {
    private let session = ARSession()
    private weak var bus: SensorBus?

    func start(bus: SensorBus) {
        self.bus = bus
        let config = ARWorldTrackingConfiguration()
        if ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth) {
            config.frameSemantics.insert(.sceneDepth)
            DispatchQueue.main.async { bus.depthSupported = true }
        }
        session.delegate = self
        session.run(config, options: [.resetTracking, .removeExistingAnchors])
    }

    func stop() { session.pause() }

    func session(_ session: ARSession, didUpdate frame: ARFrame) {
        var minD: Float = .greatestFiniteMagnitude, maxD: Float = 0, sum: Float = 0, count: Float = 0
        if let depth = frame.sceneDepth {
            let map = depth.depthMap
            let w = CVPixelBufferGetWidth(map), h = CVPixelBufferGetHeight(map)
            // Rows can be padded: index by bytesPerRow, never assume w*h contiguous floats.
            let rowFloats = CVPixelBufferGetBytesPerRow(map) / MemoryLayout<Float32>.size
            CVPixelBufferLockBaseAddress(map, .readOnly)
            if let base = CVPixelBufferGetBaseAddress(map) {
                let ptr = base.assumingMemoryBound(to: Float32.self)
                var y = 0
                while y < h {
                    var x = 0
                    while x < w {
                        let v = ptr[y * rowFloats + x]
                        if v > 0 { minD = min(minD, v); maxD = max(maxD, v); sum += v; count += 1 }
                        x += 4
                    }
                    y += 4
                }
            }
            CVPixelBufferUnlockBaseAddress(map, .readOnly)
        }
        let points = frame.rawFeaturePoints?.points.count ?? 0
        let light = frame.lightEstimate?.ambientIntensity ?? 0
        DispatchQueue.main.async {
            if count > 0 {
                self.bus?.depthMinM = minD; self.bus?.depthMaxM = maxD
                self.bus?.depthMeanM = sum / count
            }
            self.bus?.featurePoints = points
            self.bus?.ambientLight = light
        }
    }
}
