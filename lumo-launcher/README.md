# Lumo: launcher ligero para el proyector

Pantalla de inicio mínima que sustituye a la de fábrica. **24 KB**, sin servicios en segundo plano, sin widgets, sin recomendaciones, sin animaciones, sin fondo de pantalla y sin acceso a internet. Cuando abres una app, Lumo no consume nada.

- Cuadrícula con tus apps (usa los banners de TV si existen). Las más usadas suben solas.
- Mantén pulsado OK, o pulsa Menú, para fijar una app al principio, ver su información o desinstalarla.
- Botón **Liberar memoria**: cierra las apps que quedaron en segundo plano.
- Accesos directos a Wi-Fi y Ajustes, reloj y RAM libre.

## Instalar
**Opción fácil:** en Wanbo Remote, ve a *Optimizar* y pulsa *Instalar launcher ligero*.

**Manual**, con adb:
```bash
adb connect IP_DEL_PROYECTOR
adb install -r lumo.apk
adb shell cmd package set-home-activity app.lumo.launcher/.Main
```
**Sin laptop:** copia `lumo.apk` a un USB, ábrelo con el explorador de archivos del proyector y, al pulsar Inicio, elige *Lumo → Siempre*.

## Volver al launcher original
Ve a Ajustes → Apps → Lumo → Desinstalar. También puedes usar `adb uninstall app.lumo.launcher`.

## Compilar
Ejecuta `./build.sh`. No usa Gradle: necesita JDK, aapt, dx, zipalign, apksigner y android.jar (ver los comentarios del script).
