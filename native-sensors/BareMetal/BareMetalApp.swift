import SwiftUI

@main
struct BareMetalApp: App {
    @StateObject private var bus = SensorBus()
    var body: some Scene {
        WindowGroup {
            ContentView().environmentObject(bus)
        }
    }
}
