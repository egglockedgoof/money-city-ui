import AVFoundation

/// Raw microphone tap: RMS and peak straight off the input buffer.
final class AudioSensors {
    private let engine = AVAudioEngine()

    func start(bus: SensorBus) {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playAndRecord, mode: .measurement, options: [.duckOthers])
        try? session.setActive(true)
        let input = engine.inputNode
        let format = input.outputFormat(forBus: 0)
        input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
            guard let data = buffer.floatChannelData?[0] else { return }
            let n = Int(buffer.frameLength)
            var sum: Float = 0, peak: Float = 0
            for i in 0..<n {
                let v = data[i]
                sum += v * v
                peak = max(peak, abs(v))
            }
            let rms = sqrt(sum / Float(max(n, 1)))
            DispatchQueue.main.async { bus.audioRMS = rms; bus.audioPeak = peak }
        }
        try? engine.start()
    }

    func stop() {
        engine.inputNode.removeTap(onBus: 0)
        engine.stop()
        try? AVAudioSession.sharedInstance().setActive(false)
    }
}
