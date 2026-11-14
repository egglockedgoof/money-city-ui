import CoreBluetooth

/// BLE scan: every nearby peripheral, name + signal strength.
final class BluetoothSensors: NSObject, CBCentralManagerDelegate {
    private var central: CBCentralManager?
    private weak var bus: SensorBus?
    private var seen: [UUID: (String, Int)] = [:]

    func start(bus: SensorBus) {
        self.bus = bus
        central = CBCentralManager(delegate: self, queue: .main)
    }

    func stop() { central?.stopScan() }

    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state == .poweredOn {
            central.scanForPeripherals(withServices: nil, options: [CBCentralManagerScanOptionAllowDuplicatesKey: true])
        }
    }

    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral,
                        advertisementData: [String: Any], rssi RSSI: NSNumber) {
        seen[peripheral.identifier] = (peripheral.name ?? "unnamed", RSSI.intValue)
        let list = seen.values.sorted { $0.1 > $1.1 }.prefix(20).map { (name: $0.0, rssi: $0.1) }
        bus?.bleDevices = Array(list)
    }
}
