# Cáscara: no se ofusca el puente JS ni FCM.
-keepclassmembers class app.dilo.cascaron.MainActivity$DiloPuente {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.google.firebase.** { *; }
