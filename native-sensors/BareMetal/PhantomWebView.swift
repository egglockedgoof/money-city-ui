import SwiftUI
import WebKit

/// Holds the room's web view so the shell can reload it and track reachability.
/// The web view uses the default (persistent) website data store, so the room's
/// session cookie and storage live in the app's own container — they survive
/// launches, force-quits and updates, unlike the PWA whose storage iOS evicts.
final class PhantomWebStore: ObservableObject {
    @Published var failed = false
    weak var webView: WKWebView?
    private var triedFallback = false

    // The room's own client code (site/highway.js, HW_BRIDGE) only treats the
    // ts.net door and the raw tailnet IP as same-origin; any other host makes
    // every API call — sign-in included — detour to the door, and the stored
    // session token is scoped per origin, so loading from an unlisted host
    // both breaks sign-in and orphans the saved login. Load the door first,
    // the heart's IP second. Nothing else.
    private static let primaryURL = URL(string: "https://phantomway-door.tail0a8095.ts.net")
    private static let fallbackURL = URL(string: "http://100.77.206.103:3000/")

    func loadPrimary() {
        triedFallback = false
        if let url = Self.primaryURL {
            webView?.load(URLRequest(url: url))
        }
    }

    func reload() {
        if failed {
            failed = false
            loadPrimary()
        } else {
            webView?.reload()
        }
    }

    func navigationFailed() {
        if !triedFallback {
            triedFallback = true
            if let url = Self.fallbackURL {
                webView?.load(URLRequest(url: url))
                return
            }
        }
        failed = true
    }
}

struct PhantomWebView: UIViewRepresentable {
    @ObservedObject var store: PhantomWebStore

    func makeCoordinator() -> Coordinator { Coordinator(store: store) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        store.webView = webView
        store.loadPrimary()
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        let store: PhantomWebStore
        init(store: PhantomWebStore) { self.store = store }

        /// window.open / target=_blank would silently die without a UI
        /// delegate; load them in the same view so sign-in flows survive.
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = navigationAction.request.url {
                webView.load(URLRequest(url: url))
            }
            return nil
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.async { self.store.failed = false }
        }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async { self.store.navigationFailed() }
        }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async { self.store.navigationFailed() }
        }
    }
}
