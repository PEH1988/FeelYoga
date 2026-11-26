# Wanbo Remote

Una interfaz alternativa para el proyector **Wanbo T2 Ultra**, controlada desde la laptop por WiFi.

- Mando completo: cruceta, OK, atrás, inicio, menú, multimedia, encendido y silencio, más un deslizador de volumen real.
- **Pantalla en vivo** del proyector: haz clic para tocar y arrastra para deslizar.
- Lista de **apps instaladas**: un clic las abre, con clic derecho las marcas como favoritas.
- **Envío de texto** (para no escribir con el mando) y **enlaces**: los de YouTube se abren en la app de YouTube.
- Atajos de teclado: flechas, Enter, Esc, H, espacio, + y −, y T para escribir.
- Busca el proyector en tu red de forma automática.

## 1. Activar ADB en red en el proyector (una sola vez)
1. **Ajustes → Acerca de**: pulsa 7 veces sobre *Número de compilación*.
2. **Ajustes → Opciones de desarrollador**: activa *Depuración USB* o *ADB en red*.
3. Anota la IP del proyector (**Ajustes → Red**).

## 2. Instalar adb en la laptop
- macOS: `brew install android-platform-tools`
- Windows: `winget install Google.PlatformTools`
- Linux: `sudo apt install adb`

## 3. Arrancar
```bash
python3 server.py
```
Después abre http://localhost:8765. También puedes hacer doble clic en `iniciar.command` (macOS/Linux) o en `iniciar.bat` (Windows).
La primera vez, acepta **«Permitir depuración USB»** en la pantalla del proyector.

**Para usarlo desde el móvil:** arranca con `HOST=0.0.0.0 python3 server.py` y abre la URL que aparece en la terminal.

## Optimizar (más rápido y silencioso)
La sección **Optimizar** se conecta al proyector y:
- Muestra la RAM, la temperatura, la carga de CPU y qué procesos consumen más.
- **Instala Lumo**, un launcher de 24 KB que reemplaza la pantalla de inicio de fábrica (ver `../lumo-launcher`).
- **Desactiva componentes prescindibles** (impresión, salvapantallas, recomendaciones, servicios de móvil…). Es reversible: no borra nada y «Restaurar todo» lo devuelve.
- Pone las **animaciones a 0.5×** y **libera RAM y caché**.
- Bloquea los paquetes esenciales: sistema, WiFi, imagen, HDMI y corrección trapezoidal.
