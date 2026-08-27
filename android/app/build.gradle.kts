plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "app.dilo.cascaron"
    compileSdk = 35

    defaultConfig {
        applicationId = "app.dilo.cascaron"
        minSdk = 26
        targetSdk = 35
        versionCode = 2
        versionName = "1.0.1"
    }

    val keystoreDilo = file("dilo-debug.keystore")
    if (keystoreDilo.exists()) {
        signingConfigs {
            create("dilo") {
                storeFile = keystoreDilo
                storePassword = "android"
                keyAlias = "androiddebugkey"
                keyPassword = "android"
            }
        }
    }

    buildTypes {
        debug {
            if (keystoreDilo.exists()) {
                signingConfig = signingConfigs.getByName("dilo")
            }
        }
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            if (keystoreDilo.exists()) {
                signingConfig = signingConfigs.getByName("dilo")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.core:core-ktx:1.15.0")
    implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
    implementation("com.google.firebase:firebase-messaging")
}

if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}
