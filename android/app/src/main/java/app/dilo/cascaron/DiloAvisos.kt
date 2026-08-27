package app.dilo.cascaron

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

object DiloAvisos {
    const val CANAL = "dilo_avisos"

    fun crearCanal(contexto: Context) {
        val canal = NotificationChannel(
            CANAL,
            "Avisos de Dilo",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "Recordatorios y automatizaciones"
            enableVibration(true)
        }
        val gestor = contexto.getSystemService(NotificationManager::class.java)
        gestor.createNotificationChannel(canal)
    }

    fun mostrar(contexto: Context, titulo: String, cuerpo: String) {
        crearCanal(contexto)
        val abrir = Intent(contexto, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pending = PendingIntent.getActivity(
            contexto,
            cuerpo.hashCode(),
            abrir,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val notificacion = NotificationCompat.Builder(contexto, CANAL)
            .setSmallIcon(R.drawable.ic_stat_dilo)
            .setContentTitle(titulo)
            .setContentText(cuerpo)
            .setStyle(NotificationCompat.BigTextStyle().bigText(cuerpo))
            .setAutoCancel(true)
            .setColor(ContextCompat.getColor(contexto, R.color.dilo_cian))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pending)
            .build()
        try {
            NotificationManagerCompat.from(contexto).notify(cuerpo.hashCode(), notificacion)
        } catch (_: SecurityException) {
            // Sin POST_NOTIFICATIONS el sistema ignora el aviso.
        }
    }
}
