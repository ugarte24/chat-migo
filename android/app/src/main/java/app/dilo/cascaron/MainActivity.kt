package app.dilo.cascaron

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    private lateinit var web: WebView

    private val pedirPermisos = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { /* el mic se vuelve a pedir al tocar el orbe */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.parseColor("#0EA5E9")
        DiloEstado.actividad = this
        DiloAvisos.crearCanal(this)
        solicitarPermisosNativos()
        pedirTokenFcm()

        web = WebView(this)
        configurarWeb(web)
        setContentView(
            web,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
            ),
        )

        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (web.canGoBack()) web.goBack() else finish()
                }
            },
        )

        web.loadUrl(urlInicio())
    }

    override fun onResume() {
        super.onResume()
        web.onResume()
    }

    override fun onPause() {
        web.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        if (DiloEstado.actividad === this) DiloEstado.actividad = null
        web.destroy()
        super.onDestroy()
    }

    fun inyectarNativo() {
        if (!::web.isInitialized) return
        val payload = JSONObject()
            .put("plataforma", "android")
            .put("tokenFcm", DiloEstado.tokenFcm)
            .toString()
        web.evaluateJavascript(
            "window.DiloNativo=$payload;window.dispatchEvent(new Event('dilo-nativo'));",
            null,
        )
    }

    private fun urlInicio(): String {
        val base = getString(R.string.dilo_url).trimEnd('/')
        val ruta = getString(R.string.dilo_ruta)
        return if (ruta.startsWith("/")) "$base$ruta" else "$base/$ruta"
    }

    private fun hostPermitido(): String {
        return Uri.parse(getString(R.string.dilo_url)).host.orEmpty()
    }

    private fun solicitarPermisosNativos() {
        val faltantes = mutableListOf(Manifest.permission.RECORD_AUDIO)
        if (Build.VERSION.SDK_INT >= 33) {
            faltantes += Manifest.permission.POST_NOTIFICATIONS
        }
        val pedir = faltantes.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (pedir.isNotEmpty()) pedirPermisos.launch(pedir.toTypedArray())
    }

    private fun pedirTokenFcm() {
        try {
            if (FirebaseApp.getApps(this).isEmpty()) {
                FirebaseApp.initializeApp(this) ?: return
            }
        } catch (_: Exception) {
            return
        }
        try {
            FirebaseMessaging.getInstance().token.addOnCompleteListener { tarea ->
                if (!tarea.isSuccessful) return@addOnCompleteListener
                val token = tarea.result ?: return@addOnCompleteListener
                DiloEstado.tokenFcm = token
                inyectarNativo()
            }
        } catch (_: Exception) {
            // Sin google-services.json la cáscara sigue cargando la web.
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configurarWeb(vista: WebView) {
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(vista, true)

        vista.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            userAgentString = "$userAgentString DiloAndroid/1"
        }

        vista.addJavascriptInterface(DiloPuente(), "DiloPuente")
        vista.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest,
            ): Boolean {
                val uri = request.url
                val host = uri.host.orEmpty()
                if (host == hostPermitido() || host.endsWith(".${hostPermitido()}")) {
                    return false
                }
                startActivity(Intent(Intent.ACTION_VIEW, uri))
                return true
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                inyectarNativo()
            }
        }
        vista.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    val origen = request.origin?.host.orEmpty()
                    val permitido = hostPermitido()
                    if (origen != permitido && !origen.endsWith(".$permitido")) {
                        request.deny()
                        return@runOnUiThread
                    }
                    if (ContextCompat.checkSelfPermission(
                            this@MainActivity,
                            Manifest.permission.RECORD_AUDIO,
                        ) != PackageManager.PERMISSION_GRANTED
                    ) {
                        solicitarPermisosNativos()
                        request.deny()
                        return@runOnUiThread
                    }
                    val audio = request.resources.filter {
                        it == PermissionRequest.RESOURCE_AUDIO_CAPTURE
                    }.toTypedArray()
                    if (audio.isEmpty()) request.deny() else request.grant(audio)
                }
            }
        }
    }

    inner class DiloPuente {
        @JavascriptInterface
        fun plataforma(): String = "android"

        @JavascriptInterface
        fun tokenFcm(): String = DiloEstado.tokenFcm
    }
}
