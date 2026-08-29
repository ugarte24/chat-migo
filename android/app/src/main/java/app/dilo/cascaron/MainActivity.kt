package app.dilo.cascaron

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioDeviceInfo
import android.media.AudioFocusRequest
import android.media.AudioManager
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
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    private lateinit var web: WebView
    private var pedidoFoco: AudioFocusRequest? = null

    private val pedirPermisos = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { /* el mic se vuelve a pedir al tocar el orbe */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val colorBarra = ContextCompat.getColor(this, R.color.dilo_cian)
        val colorFondo = ContextCompat.getColor(this, R.color.dilo_fondo)
        window.statusBarColor = colorBarra
        window.navigationBarColor = colorFondo
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = true
        }
        DiloEstado.actividad = this
        DiloAvisos.crearCanal(this)
        volumeControlStream = AudioManager.STREAM_MUSIC
        activarParlante()
        solicitarPermisosNativos()
        pedirTokenFcm()

        web = WebView(this)
        configurarWeb(web)

        val raiz = FrameLayout(this).apply {
            setBackgroundColor(colorFondo)
            addView(
                web,
                FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT,
                ),
            )
        }
        ViewCompat.setOnApplyWindowInsetsListener(raiz) { vista, insets ->
            val barras = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout(),
            )
            val teclado = insets.getInsets(WindowInsetsCompat.Type.ime())
            vista.updatePadding(
                left = barras.left,
                top = barras.top,
                right = barras.right,
                bottom = maxOf(barras.bottom, teclado.bottom),
            )
            WindowInsetsCompat.CONSUMED
        }
        setContentView(
            raiz,
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
        activarParlante()
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
            .put("version", BuildConfig.VERSION_NAME)
            .put("versionCode", BuildConfig.VERSION_CODE)
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
            userAgentString =
                "$userAgentString DiloAndroid/${BuildConfig.VERSION_NAME}/${BuildConfig.VERSION_CODE}"
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
                    if (audio.isEmpty()) request.deny() else {
                        request.grant(audio)
                        activarParlante()
                    }
                }
            }
        }
    }

    /**
     * getUserMedia pone MODE_IN_COMMUNICATION y Android manda la salida al auricular.
     * Sin esto la voz de Dilo no se oye (o se oye pegando el teléfono a la oreja).
     */
    private fun activarParlante() {
        val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        try {
            volumeControlStream = AudioManager.STREAM_MUSIC
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val attrs = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
                val pedido = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(attrs)
                    .setAcceptsDelayedFocusGain(false)
                    .build()
                pedidoFoco = pedido
                am.requestAudioFocus(pedido)
            } else {
                @Suppress("DEPRECATION")
                am.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
            }
            am.mode = AudioManager.MODE_IN_COMMUNICATION
            @Suppress("DEPRECATION")
            am.isSpeakerphoneOn = true
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val parlante = am.availableCommunicationDevices.firstOrNull {
                    it.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER
                }
                if (parlante != null) am.setCommunicationDevice(parlante)
            }
        } catch (_: Exception) {
            /* el WebView igual puede reproducir por el altavoz del sistema */
        }
    }

    inner class DiloPuente {
        @JavascriptInterface
        fun plataforma(): String = "android"

        @JavascriptInterface
        fun version(): String = BuildConfig.VERSION_NAME

        @JavascriptInterface
        fun versionCode(): Int = BuildConfig.VERSION_CODE

        @JavascriptInterface
        fun tokenFcm(): String = DiloEstado.tokenFcm

        @JavascriptInterface
        fun usarParlante() {
            runOnUiThread { activarParlante() }
        }

        @JavascriptInterface
        fun abrirDescarga(url: String) {
            try {
                startActivity(
                    Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
                )
            } catch (_: Exception) {
                /* el enlace se abre en el navegador si el sistema lo permite */
            }
        }
    }
}
