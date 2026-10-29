package com.lmracing.f116bits;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.pm.ApplicationInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;

/** Offline shell. All web resources come from APK assets on one HTTPS origin. */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/assets/index.html";
    private WebView webView;
    private boolean foreground;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        webView = new WebView(this);
        webView.setBackgroundColor(0xff05020c);
        setContentView(webView);
        if (Build.VERSION.SDK_INT >= 28) {
            webView.setOnApplyWindowInsetsListener((view, insets) -> {
                android.view.DisplayCutout cutout = insets.getDisplayCutout();
                view.setPadding(cutout == null ? 0 : cutout.getSafeInsetLeft(),
                    cutout == null ? 0 : cutout.getSafeInsetTop(),
                    cutout == null ? 0 : cutout.getSafeInsetRight(),
                    cutout == null ? 0 : cutout.getSafeInsetBottom());
                return insets;
            });
        }
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        if (Build.VERSION.SDK_INT >= 26) settings.setSafeBrowsingEnabled(true);
        WebView.setWebContentsDebuggingEnabled((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0);
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return localAsset(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !START_URL.equals(request.getUrl().toString());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !START_URL.equals(url);
            }
            @Override public void onPageFinished(WebView view, String url) {
                view.evaluateJavascript("document.getElementById('installPanel').hidden = true;", null);
            }
        });
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(0, this::handleBack);
        }
        webView.loadUrl(START_URL);
        hideSystemBars();
    }

    private WebResourceResponse localAsset(Uri uri) {
        String path = uri.getPath();
        if (!"https".equals(uri.getScheme()) || !HOST.equals(uri.getHost()) ||
                path == null || !path.startsWith("/assets/") || path.contains("..")) {
            return response(403, "Forbidden", "text/plain", new ByteArrayInputStream(new byte[0]));
        }
        String file = path.substring("/assets/".length());
        String mime = "application/octet-stream";
        if (file.endsWith(".html")) mime = "text/html";
        else if (file.endsWith(".js")) mime = "text/javascript";
        else if (file.endsWith(".css")) mime = "text/css";
        else if (file.endsWith(".png")) mime = "image/png";
        else if (file.endsWith(".svg")) mime = "image/svg+xml";
        else if (file.endsWith(".webmanifest")) mime = "application/manifest+json";
        try { return response(200, "OK", mime, getAssets().open(file)); }
        catch (IOException error) {
            return response(404, "Not Found", "text/plain", new ByteArrayInputStream(new byte[0]));
        }
    }

    private WebResourceResponse response(int status, String reason, String mime, InputStream stream) {
        return new WebResourceResponse(mime, "UTF-8", status, reason,
            Collections.singletonMap("Cache-Control", "no-store"), stream);
    }

    private void hideSystemBars() {
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.systemBars());
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN |
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        }
    }

    @Override public void onWindowFocusChanged(boolean focused) {
        super.onWindowFocusChanged(focused);
        if (focused) hideSystemBars();
    }

    @Override protected void onPause() {
        foreground = false;
        if (webView != null) {
            webView.evaluateJavascript("window.dispatchEvent(new Event('nativepause'));", result -> {
                if (webView != null && !foreground) webView.pauseTimers();
            });
            webView.onPause();
        }
        super.onPause();
    }

    @Override protected void onResume() {
        super.onResume();
        foreground = true;
        if (webView != null) {
            webView.resumeTimers();
            webView.onResume();
            webView.evaluateJavascript("window.dispatchEvent(new Event('nativeresume'));", null);
        }
        hideSystemBars();
    }

    @Override public void onBackPressed() { handleBack(); }

    private void handleBack() {
        webView.evaluateJavascript("(function(){const home = getComputedStyle(document.getElementById('titleScreen')).display !== 'none';" +
            "if (!home) window.dispatchEvent(new Event('nativeback')); return home;})()", result -> {
            if ("true".equals(result)) {
                new AlertDialog.Builder(this).setTitle("Sair do jogo?")
                    .setMessage("As etapas concluídas e os recordes salvos serão mantidos.")
                    .setPositiveButton("SAIR", (dialog, which) -> finish())
                    .setNegativeButton("CONTINUAR", (dialog, which) -> hideSystemBars()).show();
            }
        });
    }

    @Override protected void onDestroy() {
        if (webView != null) { webView.destroy(); webView = null; }
        super.onDestroy();
    }
}
