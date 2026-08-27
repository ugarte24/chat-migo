package app.dilo.cascaron

object DiloEstado {
    @Volatile
    var tokenFcm: String = ""

    @Volatile
    var actividad: MainActivity? = null
}
