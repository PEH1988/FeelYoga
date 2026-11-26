#!/bin/bash
# Compila Lumo sin Gradle. Necesita: JDK, aapt, dx (dalvik-exchange), zipalign, apksigner y android.jar (API 23+).
# Ubuntu/Debian: sudo apt install default-jdk aapt dalvik-exchange zipalign apksigner android-sdk-platform-23
set -euo pipefail
cd "$(dirname "$0")"
JAR=${ANDROID_JAR:-$(ls /usr/lib/android-sdk/platforms/*/android.jar | tail -1)}
DX=$(command -v dx || command -v dalvik-exchange)
rm -rf build && mkdir -p build/gen build/classes
aapt package -f -M AndroidManifest.xml -S res -I "$JAR" -J build/gen -F build/unsigned.apk
javac --release 8 -nowarn -Xlint:-options -encoding UTF-8 -cp "$JAR" -d build/classes $(find src build/gen -name '*.java')
"$DX" --dex --output=build/classes.dex build/classes
(cd build && aapt add -f unsigned.apk classes.dex >/dev/null)
zipalign -f 4 build/unsigned.apk build/aligned.apk
[ -f lumo.keystore ] || keytool -genkeypair -keystore lumo.keystore -storepass lumolumo -keypass lumolumo \
  -alias lumo -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Lumo" >/dev/null 2>&1
apksigner sign --ks lumo.keystore --ks-pass pass:lumolumo --out lumo.apk build/aligned.apk
rm -f lumo.apk.idsig
echo "OK → $(pwd)/lumo.apk ($(du -k lumo.apk | cut -f1) KB)"
