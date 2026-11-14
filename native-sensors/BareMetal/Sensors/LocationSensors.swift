import CoreLocation

/// GPS at best accuracy plus true-north heading.
final class LocationSensors: NSObject, CLLocationManagerDelegate {
    private let lm = CLLocationManager()
    private weak var bus: SensorBus?

    func start(bus: SensorBus) {
        self.bus = bus
        lm.delegate = self
        lm.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        lm.requestWhenInUseAuthorization()
        lm.startUpdatingLocation()
        lm.startUpdatingHeading()
    }

    func stop() { lm.stopUpdatingLocation(); lm.stopUpdatingHeading() }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.last else { return }
        DispatchQueue.main.async { self.bus?.location = loc }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        DispatchQueue.main.async { self.bus?.headingDeg = newHeading.trueHeading }
    }
}
