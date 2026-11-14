import CoreMotion

/// Raw motion: accelerometer, gyroscope, magnetometer at the fastest
/// rate the hardware allows, plus the barometer (CMAltimeter).
final class MotionSensors {
    private let mm = CMMotionManager()
    private let altimeter = CMAltimeter()
    private let queue = OperationQueue()

    func start(bus: SensorBus) {
        queue.maxConcurrentOperationCount = 1
        if mm.isAccelerometerAvailable {
            mm.accelerometerUpdateInterval = 1.0 / 100.0
            mm.startAccelerometerUpdates(to: queue) { data, _ in
                guard let d = data else { return }
                DispatchQueue.main.async { bus.accel = d.acceleration }
            }
        }
        if mm.isGyroAvailable {
            mm.gyroUpdateInterval = 1.0 / 100.0
            mm.startGyroUpdates(to: queue) { data, _ in
                guard let d = data else { return }
                DispatchQueue.main.async { bus.gyro = d.rotationRate }
            }
        }
        if mm.isMagnetometerAvailable {
            mm.magnetometerUpdateInterval = 1.0 / 50.0
            mm.startMagnetometerUpdates(to: queue) { data, _ in
                guard let d = data else { return }
                DispatchQueue.main.async { bus.mag = d.magneticField }
            }
        }
        if mm.isDeviceMotionAvailable {
            mm.deviceMotionUpdateInterval = 1.0 / 60.0
            mm.startDeviceMotionUpdates(to: queue) { data, _ in
                guard let d = data else { return }
                DispatchQueue.main.async { bus.attitude = d.attitude }
            }
        }
        if CMAltimeter.isRelativeAltitudeAvailable() {
            altimeter.startRelativeAltitudeUpdates(to: queue) { data, _ in
                guard let d = data else { return }
                DispatchQueue.main.async {
                    bus.pressureKPa = d.pressure.doubleValue
                    bus.relativeAltitudeM = d.relativeAltitude.doubleValue
                }
            }
        }
    }

    func stop() {
        mm.stopAccelerometerUpdates(); mm.stopGyroUpdates()
        mm.stopMagnetometerUpdates(); mm.stopDeviceMotionUpdates()
        altimeter.stopRelativeAltitudeUpdates()
    }
}
