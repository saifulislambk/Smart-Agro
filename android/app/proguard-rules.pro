# Project specific ProGuard rules for Smart Agro Capacitor Android
-keep public class * extends com.getcapacitor.Plugin
-keep public class * extends com.getcapacitor.Bridge
-keep public class bd.smartagro.app.MainActivity

-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public *;
    @android.webkit.JavascriptInterface <methods>;
}

-keepattributes *Annotation*
-dontwarn com.google.android.gms.**
