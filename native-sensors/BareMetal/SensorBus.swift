import Foundation
import CoreMotion
import CoreLocation

/// Central bus. Every sensor module publishes raw samples here with
/// hardware timestamps. Nothing is smoothed unless a module says so.
final class SensorBus: ObservableObject {
    // Motion (raw, hardware units)
    @Published var accel = CMAcceleration()          // g
    @Published var gyro = CMRotationRate()           // rad/s
    @Published var mag = CMMagneticField()           // microtesla
    @Published var attitude: CMAttitude?
    @Published var pressureKPa: Double = 0           // barometer
    @Published var relativeAltitudeM: Double = 0
    // Location
    @Published var location: CLLocation?
    @Published var headingDeg: Double = 0
    // Audio (raw tap)
    @Published var audioRMS: Float = 0
    @Published var audioPeak: Float = 0
    // Depth / AR
    @Published var depthSupported = false
    @Published var depthMinM: Float = 0
    @Published var depthMaxM: Float = 0
    @Published var depthMeanM: Float = 0
    @Published var featurePoints: Int = 0
    @Published var ambientLight: Double = 0          // lumens estimate from AR
    // Bluetooth
    @Published var bleDevices: [(name: String, rssi: Int)] = []
    // Device body
    @Published var batteryLevel: Float = -1
    @Published var batteryState = "unknown"
    @Published var thermalState = "nominal"
    @Published var proximityNear = false
    @Published var screenBrightness: Double = 0

    private let motion = MotionSensors()
    private let locationM = LocationSensors()
    private let audio = AudioSensors()
    private let depth = DepthSensors()
    private let bluetooth = BluetoothSensors()
    private let device = DeviceSensors()
    @Published var running = false

    func startAll() {
        guard !running else { return }
        running = true
        motion.start(bus: self)
        locationM.start(bus: self)
        audio.start(bus: self)
        depth.start(bus: self)
        bluetooth.start(bus: self)
        device.start(bus: self)
    }

    func stopAll() {
        running = false
        motion.stop(); locationM.stop(); audio.stop()
        depth.stop(); bluetooth.stop(); device.stop()
    }
}
