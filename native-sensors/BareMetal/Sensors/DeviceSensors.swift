import UIKit

/// The body itself: battery, thermal pressure, proximity, brightness.
final class DeviceSensors {
    private var timer: Timer?

    func start(bus: SensorBus) {
        UIDevice.current.isBatteryMonitoringEnabled = true
        UIDevice.current.isProximityMonitoringEnabled = true
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            let d = UIDevice.current
            bus.batteryLevel = d.batteryLevel
            bus.batteryState = "\(d.batteryState)"
            bus.thermalState = "\(ProcessInfo.processInfo.thermalState)"
            bus.proximityNear = d.proximityState
            bus.screenBrightness = UIScreen.main.brightness
        }
    }

    func stop() {
        timer?.invalidate(); timer = nil
        UIDevice.current.isBatteryMonitoringEnabled = false
        UIDevice.current.isProximityMonitoringEnabled = false
    }
}
