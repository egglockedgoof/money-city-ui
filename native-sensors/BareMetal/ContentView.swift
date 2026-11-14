import SwiftUI

/// The app is PhantomWay: the crew room as a native app, signed in once and
/// staying that way. Just the room, full screen — no chrome over it.
/// The sensor suite stays compiled and wired (SensorConsoleView below,
/// SensorBus in the app entry) but is not surfaced in the UI for now,
/// on sin's word: wired, not integrated.
struct ContentView: View {
    @StateObject private var webStore = PhantomWebStore()

    var body: some View {
        ZStack {
            PhantomWebView(store: webStore)
                .ignoresSafeArea()

            if webStore.failed {
                VStack(spacing: 12) {
                    Text("Bridge unreachable")
                        .font(.headline)
                    Text("The room lives on your tailnet — check Tailscale is connected, then retry.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                    Button("Retry") { webStore.reload() }
                }
                .padding()
                .background(.ultraThinMaterial)
            }
        }
    }
}

struct SensorConsoleView: View {
    @EnvironmentObject var bus: SensorBus

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Button(bus.running ? "Stop all sensors" : "Start all sensors") {
                        bus.running ? bus.stopAll() : bus.startAll()
                    }
                }
                Section("Motion — raw") {
                    row("accel g", f(bus.accel.x) + ", " + f(bus.accel.y) + ", " + f(bus.accel.z))
                    row("gyro rad/s", f(bus.gyro.x) + ", " + f(bus.gyro.y) + ", " + f(bus.gyro.z))
                    row("mag µT", f(bus.mag.x) + ", " + f(bus.mag.y) + ", " + f(bus.mag.z))
                    row("pressure kPa", f(bus.pressureKPa))
                    row("rel altitude m", f(bus.relativeAltitudeM))
                }
                Section("Place") {
                    row("lat / lon", bus.location.map { f($0.coordinate.latitude) + ", " + f($0.coordinate.longitude) } ?? "—")
                    row("altitude m", bus.location.map { f($0.altitude) } ?? "—")
                    row("speed m/s", bus.location.map { f($0.speed) } ?? "—")
                    row("heading°", f(bus.headingDeg))
                }
                Section("Ears — raw tap") {
                    row("RMS", "\(bus.audioRMS)")
                    row("peak", "\(bus.audioPeak)")
                }
                Section("Eyes — depth") {
                    row("LiDAR depth", bus.depthSupported ? "supported" : "not on this device")
                    row("depth min m", "\(bus.depthMinM)")
                    row("depth mean m", "\(bus.depthMeanM)")
                    row("depth max m", "\(bus.depthMaxM)")
                    row("feature points", "\(bus.featurePoints)")
                    row("ambient light", f(bus.ambientLight))
                }
                Section("Bluetooth nearby") {
                    if bus.bleDevices.isEmpty { Text("scanning…").foregroundStyle(.secondary) }
                    ForEach(Array(bus.bleDevices.enumerated()), id: \.offset) { _, d in
                        row(d.name, "\(d.rssi) dBm")
                    }
                }
                Section("Body") {
                    row("battery", bus.batteryLevel >= 0 ? "\(Int(bus.batteryLevel * 100))% (\(bus.batteryState))" : "—")
                    row("thermal", bus.thermalState)
                    row("proximity", bus.proximityNear ? "near" : "far")
                    row("brightness", f(bus.screenBrightness))
                }
            }
            .navigationTitle("BareMetal")
            .font(.system(.body, design: .monospaced))
        }
    }

    private func row(_ k: String, _ v: String) -> some View {
        HStack { Text(k).foregroundStyle(.secondary); Spacer(); Text(v) }
    }
    private func f(_ v: Double) -> String { String(format: "%.3f", v) }
}
