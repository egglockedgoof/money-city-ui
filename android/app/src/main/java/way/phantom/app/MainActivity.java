package way.phantom.app;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

/**
 * PhantomWay: a thin native shell around the Face. The heart (bridge) runs on this phone in
 * Termux, so the app tries the phone's own loopback first, then the Tailscale address, then the
 * HTTPS door. All Face logic stays in the web app; this shell only adds what a WebView lacks.
 */
public class MainActivity extends Activity {
    private static final String[] ORIGINS = {
            "http://127.0.0.1:3000/",
            "http://100.77.206.103:3000/",
            "https://phantomway-door.tail0a8095.ts.net/"
    };
    private static final int REQ_FILE = 41, REQ_PERMS = 42, REQ_NOTIF = 43;
    private static final String CHANNEL = "room";

    private WebView web;
    private String origin;              // the origin the Face was loaded from
    private ValueCallback<Uri[]> fileCb;
    private PermissionRequest pendingWebPerm;
    private GeolocationPermissions.Callback geoCb;
    private String geoOrigin;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService io = Executors.newCachedThreadPool();
    private String tried = "";
    private boolean probing = false;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        Window w = getWindow();
        w.setStatusBarColor(Color.parseColor("#05070C"));
        w.setNavigationBarColor(Color.parseColor("#05070C"));

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#05070C"));   // never a white frame
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);           // no glow / pull effects
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setGeolocationEnabled(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);                                      // the realm sets its own type scale
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setUserAgentString(s.getUserAgentString() + " PhantomWayApp/1.0");
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
        web.addJavascriptInterface(new Bridge(), "PhantomNative");
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());
        setContentView(web);

        ensureChannel();
        if (state != null && web.restoreState(state) != null) {
            origin = getPrefs().getString("origin", null);
        } else {
            connect();
        }
    }

    private SharedPreferences getPrefs() { return getSharedPreferences("phantom", MODE_PRIVATE); }

    /** Probe the heart addresses in parallel; load the first in preference order that answers. */
    private void connect() {
        if (probing) return;
        probing = true;
        final String last = getPrefs().getString("origin", null);
        io.execute(() -> {
            List<String> order = new ArrayList<>();
            for (String o : ORIGINS) order.add(o);
            List<Future<Boolean>> res = new ArrayList<>();
            for (String o : order) res.add(io.submit(() -> reachable(o)));
            String pick = null;
            StringBuilder t = new StringBuilder();
            for (int i = 0; i < order.size(); i++) {
                boolean ok = false;
                try { ok = res.get(i).get(4, TimeUnit.SECONDS); } catch (Exception ignored) { }
                t.append(ok ? "✓ " : "✗ ").append(order.get(i).replaceAll("^https?://|/$", "")).append("  ");
                if (ok && pick == null) pick = order.get(i);
            }
            final String chosen = pick;
            tried = t.toString().trim();
            main.post(() -> {
                probing = false;
                if (chosen != null) {
                    origin = chosen;
                    getPrefs().edit().putString("origin", chosen).apply();
                    web.loadUrl(chosen);
                } else if (last != null && origin == null) {
                    origin = last;                 // let the Face's own offline/retry UI handle it
                    web.loadUrl(last);
                } else {
                    web.loadUrl("file:///android_asset/offline.html");
                }
            });
        });
    }

    private static boolean reachable(String base) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(base + "health").openConnection();
            c.setConnectTimeout(2500);
            c.setReadTimeout(2500);
            c.setRequestMethod("GET");
            int code = c.getResponseCode();
            return code > 0 && code < 500;
        } catch (Exception e) {
            return false;
        } finally {
            if (c != null) c.disconnect();
        }
    }

    private boolean isOurs(Uri u) {
        if (u == null) return false;
        String s = u.toString();
        if (s.startsWith("file:///android_asset/")) return true;
        for (String o : ORIGINS) if (s.startsWith(o)) return true;
        return false;
    }

    private class Client extends WebViewClient {
        @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
            Uri u = r.getUrl();
            if (isOurs(u)) return false;
            try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (ActivityNotFoundException ignored) { }
            return true;   // links out (news, attachments) open in the browser, not over the room
        }
        @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
            if (r.isForMainFrame()) {
                tried = "load failed: " + e.getDescription();
                v.loadUrl("file:///android_asset/offline.html");
            }
        }
        @Override public void onPageFinished(WebView v, String url) { CookieManager.getInstance().flush(); }
    }

    private class Chrome extends WebChromeClient {
        @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
            if (fileCb != null) fileCb.onReceiveValue(null);
            fileCb = cb;
            Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
            pick.addCategory(Intent.CATEGORY_OPENABLE);
            String[] types = p.getAcceptTypes();
            String type = "*/*";
            if (types != null && types.length == 1 && types[0] != null && !types[0].isEmpty() && !types[0].contains(",")) type = types[0];
            pick.setType(type);
            if (types != null && types.length > 0) {
                List<String> mimes = new ArrayList<>();
                for (String t : types) for (String one : t.split(",")) { one = one.trim(); if (one.contains("/")) mimes.add(one); }
                if (!mimes.isEmpty()) pick.putExtra(Intent.EXTRA_MIME_TYPES, mimes.toArray(new String[0]));
            }
            pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, p.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
            try { startActivityForResult(Intent.createChooser(pick, "Attach"), REQ_FILE); }
            catch (ActivityNotFoundException e) { fileCb = null; return false; }
            return true;
        }
        @Override public void onPermissionRequest(PermissionRequest req) {
            if (!isOurs(req.getOrigin())) { req.deny(); return; }
            List<String> need = new ArrayList<>();
            for (String r : req.getResources()) {
                if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) need.add(Manifest.permission.RECORD_AUDIO);
                if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) need.add(Manifest.permission.CAMERA);
            }
            List<String> missing = new ArrayList<>();
            for (String n : need) if (checkSelfPermission(n) != PackageManager.PERMISSION_GRANTED) missing.add(n);
            if (missing.isEmpty()) { req.grant(req.getResources()); return; }
            pendingWebPerm = req;
            requestPermissions(missing.toArray(new String[0]), REQ_PERMS);
        }
        @Override public void onGeolocationPermissionsShowPrompt(String o, GeolocationPermissions.Callback cb) {
            if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) { cb.invoke(o, true, false); return; }
            geoCb = cb; geoOrigin = o;
            requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, REQ_PERMS + 10);
        }
    }

    @Override public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        boolean all = results.length > 0;
        for (int r : results) if (r != PackageManager.PERMISSION_GRANTED) all = false;
        if (code == REQ_PERMS && pendingWebPerm != null) {
            if (all) pendingWebPerm.grant(pendingWebPerm.getResources()); else pendingWebPerm.deny();
            pendingWebPerm = null;
        } else if (code == REQ_PERMS + 10 && geoCb != null) {
            geoCb.invoke(geoOrigin, all, false); geoCb = null;
        }
    }

    @Override protected void onActivityResult(int req, int result, Intent data) {
        if (req == REQ_FILE && fileCb != null) {
            Uri[] out = null;
            if (result == RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    int n = data.getClipData().getItemCount();
                    out = new Uri[n];
                    for (int i = 0; i < n; i++) out[i] = data.getClipData().getItemAt(i).getUri();
                } else if (data.getData() != null) out = new Uri[]{data.getData()};
            }
            fileCb.onReceiveValue(out);
            fileCb = null;
            return;
        }
        super.onActivityResult(req, result, data);
    }

    /** Back: close the picture viewer / go back in the Face; at the root, minimize (never kill the room). */
    @Override public void onBackPressed() {
        if (web != null && web.canGoBack()) { web.goBack(); return; }
        moveTaskToBack(true);
    }

    @Override protected void onResume() {
        super.onResume();
        web.onResume();
        String u = web.getUrl();
        if (u != null && u.startsWith("file:///android_asset/")) connect();   // came back while offline: retry
    }
    @Override protected void onPause() {
        // Keep JS timers alive (no pauseTimers) so the room stays warm and can notify; just persist cookies.
        CookieManager.getInstance().flush();
        super.onPause();
    }
    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }
    @Override protected void onDestroy() { io.shutdownNow(); super.onDestroy(); }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Room messages", NotificationManager.IMPORTANCE_HIGH);
            ch.setLightColor(Color.parseColor("#C1121F"));
            ch.enableVibration(true);
            ((NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE)).createNotificationChannel(ch);
        }
    }

    /** window.PhantomNative — only what the web can't do itself. */
    private class Bridge {
        @JavascriptInterface public void retry() { main.post(MainActivity.this::connect); }
        @JavascriptInterface public String tried() { return tried; }
        @JavascriptInterface public boolean canNotify() {
            return Build.VERSION.SDK_INT < 33 || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
        }
        @JavascriptInterface public void askNotify() {
            if (Build.VERSION.SDK_INT >= 33) main.post(() -> requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIF));
        }
        @JavascriptInterface public void notify(String title, String body) {
            if (!canNotify()) return;
            String t = title == null ? "PhantomWay" : title.substring(0, Math.min(60, title.length()));
            String b = body == null ? "" : body.substring(0, Math.min(240, body.length()));
            Intent open = new Intent(MainActivity.this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pi = PendingIntent.getActivity(MainActivity.this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            Notification.Builder nb = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(MainActivity.this, CHANNEL) : new Notification.Builder(MainActivity.this);
            nb.setSmallIcon(android.R.drawable.stat_notify_chat).setContentTitle(t).setContentText(b)
              .setStyle(new Notification.BigTextStyle().bigText(b)).setColor(Color.parseColor("#C1121F"))
              .setAutoCancel(true).setContentIntent(pi);
            ((NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE)).notify((int) (System.currentTimeMillis() & 0xfffffff), nb.build());
        }
    }
}
