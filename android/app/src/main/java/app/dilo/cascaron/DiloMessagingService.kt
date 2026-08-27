package app.dilo.cascaron

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class DiloMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        DiloEstado.tokenFcm = token
        DiloEstado.actividad?.runOnUiThread {
            DiloEstado.actividad?.inyectarNativo()
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val titulo = message.notification?.title ?: "Dilo"
        val cuerpo = message.notification?.body
            ?: message.data["texto"]
            ?: return
        DiloAvisos.mostrar(this, titulo, cuerpo)
    }
}
