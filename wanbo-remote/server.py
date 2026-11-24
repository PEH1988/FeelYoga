#!/usr/bin/env python3
"""
Wanbo Remote — UI alternativa para el proyector Wanbo T2 Ultra (Android).

Ejecuta este servidor en tu laptop (misma red WiFi que el proyector) y abre
http://localhost:8765 en el navegador. Controla el proyector por ADB en red.

Requisitos: Python 3.8+ y `adb` (Android platform-tools) en el PATH,
o la variable de entorno ADB=/ruta/a/adb.
"""
import concurrent.futures
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

PORT = int(os.environ.get("PORT", "8765"))
ADB = os.environ.get("ADB") or shutil.which("adb") or "adb"
HERE = Path(__file__).resolve().parent
CONFIG = HERE / ".wanbo.json"

KEYS = {
    "up": 19, "down": 20, "left": 21, "right": 22, "ok": 23,
    "back": 4, "home": 3, "menu": 82, "power": 26, "sleep": 223, "wake": 224,
    "vol_up": 24, "vol_down": 25, "mute": 164,
    "play_pause": 85, "next": 87, "prev": 88, "rewind": 89, "ffwd": 90,
    "settings": 176, "recents": 187, "del": 67, "enter": 66, "search": 84,
}


def load_cfg():
    try:
        return json.loads(CONFIG.read_text())
    except Exception:
        return {}


def save_cfg(cfg):
    try:
        CONFIG.write_text(json.dumps(cfg, indent=2))
    except Exception:
        pass


class Projector:
    """Envuelve adb con un shell persistente para que las teclas respondan rápido."""

    def __init__(self):
        self.serial = load_cfg().get("serial")
        self.lock = threading.Lock()
        self.shell = None
        self.size = None

    # --- adb básico ---------------------------------------------------------
    def adb(self, *args, timeout=8, binary=False):
        cmd = [ADB] + (["-s", self.serial] if self.serial and args[0] not in ("connect", "disconnect", "devices") else []) + list(args)
        r = subprocess.run(cmd, capture_output=True, timeout=timeout)
        if binary:
            return r.stdout
        return (r.stdout + r.stderr).decode("utf-8", "replace").strip()

    def sh(self, command, timeout=8):
        return self.adb("shell", command, timeout=timeout)

    def connect(self, host):
        host = host.strip()
        if ":" not in host:
            host += ":5555"
        out = self.adb("connect", host, timeout=10)
        ok = "connected" in out and "cannot" not in out and "failed" not in out
        if ok:
            self.serial = host
            self.close_shell()
            self.size = None
            cfg = load_cfg()
            cfg["serial"] = host
            save_cfg(cfg)
        return ok, out

    def status(self):
        if not self.serial:
            return {"connected": False}
        devs = self.adb("devices")
        line = next((l for l in devs.splitlines() if l.startswith(self.serial)), "")
        state = line.split("\t")[-1] if line else "offline"
        if state != "device":
            # reintento silencioso
            self.adb("connect", self.serial, timeout=5)
            devs = self.adb("devices")
            line = next((l for l in devs.splitlines() if l.startswith(self.serial)), "")
            state = line.split("\t")[-1] if line else "offline"
        info = {"connected": state == "device", "state": state, "serial": self.serial}
        if info["connected"]:
            props = self.sh("getprop ro.product.model; getprop ro.build.version.release; "
                            "dumpsys power | grep -m1 -E 'mWakefulness=|Display Power'; "
                            "dumpsys window | grep -m1 -E 'mCurrentFocus|mFocusedApp'")
            p = props.splitlines() + ["", "", "", ""]
            info.update(model=p[0], android=p[1], awake=("Awake" in p[2] or "ON" in p[2]))
            m = re.search(r"([a-zA-Z0-9_.]+)/", p[3])
            info["foreground"] = m.group(1) if m else ""
            info["volume"] = self.volume()
        return info

    def volume(self):
        out = self.sh("cmd media_session volume --get --stream 3 2>/dev/null || "
                      "media volume --get --stream 3 2>/dev/null")
        m = re.search(r"volume is (\d+) in range \[(\d+)\.\.(\d+)\]", out)
        if m:
            return {"value": int(m.group(1)), "min": int(m.group(2)), "max": int(m.group(3))}
        return None

    # --- shell persistente para entrada rápida ------------------------------
    def close_shell(self):
        if self.shell:
            try:
                self.shell.kill()
            except Exception:
                pass
        self.shell = None

    def fast(self, command):
        with self.lock:
            for _ in range(2):
                if not self.shell or self.shell.poll() is not None:
                    self.shell = subprocess.Popen(
                        [ADB, "-s", self.serial, "shell"], stdin=subprocess.PIPE,
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                try:
                    self.shell.stdin.write((command + "\n").encode())
                    self.shell.stdin.flush()
                    return True
                except Exception:
                    self.close_shell()
        return False

    def key(self, name, long=False):
        code = KEYS.get(name, name)
        return self.fast(f"input keyevent {'--longpress ' if long else ''}{code}")

    def text(self, value):
        # input text no acepta espacios ni ciertos símbolos: escapamos
        safe = value.replace("\\", "\\\\").replace(" ", "%s")
        safe = re.sub(r"([\"'`$&|;<>()*?!#~{}\[\]])", r"\\\1", safe)
        return self.fast(f"input text {safe}")

    def screen_size(self):
        if not self.size:
            m = re.search(r"(\d+)x(\d+)", self.sh("wm size"))
            self.size = (int(m.group(1)), int(m.group(2))) if m else (1920, 1080)
        return self.size

    def tap(self, fx, fy):
        w, h = self.screen_size()
        return self.fast(f"input tap {int(fx * w)} {int(fy * h)}")

    def swipe(self, x1, y1, x2, y2, ms=250):
        w, h = self.screen_size()
        return self.fast(f"input swipe {int(x1*w)} {int(y1*h)} {int(x2*w)} {int(y2*h)} {int(ms)}")

    def screenshot(self):
        return self.adb("exec-out", "screencap", "-p", timeout=10, binary=True)

    def apps(self):
        out = self.sh("cmd package query-activities -a android.intent.action.MAIN "
                      "-c android.intent.category.LEANBACK_LAUNCHER 2>/dev/null | grep packageName=; "
                      "echo ---; "
                      "cmd package query-activities -a android.intent.action.MAIN "
                      "-c android.intent.category.LAUNCHER 2>/dev/null | grep packageName=", timeout=15)
        pkgs = re.findall(r"packageName=([\w.]+)", out)
        if not pkgs:
            pkgs = re.findall(r"package:([\w.]+)", self.sh("pm list packages -3", timeout=15))
        seen, result = set(), []
        for p in pkgs:
            if p not in seen:
                seen.add(p)
                result.append({"package": p, "name": pretty_name(p)})
        return sorted(result, key=lambda a: a["name"].lower())

    def launch(self, pkg):
        out = self.sh(f"monkey -p {pkg} -c android.intent.category.LEANBACK_LAUNCHER 1 2>&1 | grep -q 'No activities' "
                      f"&& monkey -p {pkg} -c android.intent.category.LAUNCHER 1", timeout=10)
        return "aborted" not in out.lower()

    def open_url(self, url):
        if "youtube.com" in url or "youtu.be" in url:
            m = re.search(r"(?:v=|youtu\.be/|shorts/)([\w-]{6,})", url)
            if m:
                return self.sh(f"am start -a android.intent.action.VIEW -d 'vnd.youtube:{m.group(1)}'")
        return self.sh(f"am start -a android.intent.action.VIEW -d '{url}'")


KNOWN = {
    "com.netflix.ninja": "Netflix", "com.netflix.mediaclient": "Netflix",
    "com.google.android.youtube.tv": "YouTube", "com.google.android.youtube": "YouTube",
    "com.amazon.amazonvideo.livingroom": "Prime Video", "com.disney.disneyplus": "Disney+",
    "com.hbo.hbonow": "Max", "com.wbd.stream": "Max", "com.spotify.tv.android": "Spotify",
    "com.spotify.music": "Spotify", "com.android.settings": "Ajustes", "com.android.vending": "Play Store",
    "com.plexapp.android": "Plex", "org.xbmc.kodi": "Kodi", "com.google.android.apps.tv.launcherx": "Google TV",
    "tv.twitch.android.app": "Twitch", "com.apple.atve.androidtv.appletv": "Apple TV",
    "com.aptoide.pt": "Aptoide", "com.android.chrome": "Chrome", "com.crunchyroll.crunchyroid": "Crunchyroll",
}


def pretty_name(pkg):
    if pkg in KNOWN:
        return KNOWN[pkg]
    parts = [p for p in pkg.split(".") if p not in ("com", "org", "net", "tv", "android", "app", "apps", "www")]
    return (parts[-1] if parts else pkg).replace("_", " ").title()


# --- descubrimiento en la red local -----------------------------------------
def local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()


def discover():
    base = local_ip().rsplit(".", 1)[0]

    def probe(i):
        ip = f"{base}.{i}"
        try:
            with socket.create_connection((ip, 5555), timeout=0.4):
                return ip
        except Exception:
            return None

    with concurrent.futures.ThreadPoolExecutor(max_workers=64) as ex:
        found = [ip for ip in ex.map(probe, range(1, 255)) if ip]
    return {"subnet": base + ".0/24", "found": found}


# --- servidor HTTP -------------------------------------------------------------
P = Projector()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, code, body, ctype="application/json"):
        if isinstance(body, (dict, list)):
            body = json.dumps(body).encode()
        elif isinstance(body, str):
            body = body.encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def body(self):
        n = int(self.headers.get("Content-Length") or 0)
        try:
            return json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            return {}

    def need_device(self):
        if not P.serial:
            self.send(409, {"error": "Sin proyector conectado"})
            return False
        return True

    def do_GET(self):
        url = urlparse(self.path)
        try:
            if url.path in ("/", "/index.html"):
                return self.send(200, (HERE / "index.html").read_bytes(), "text/html; charset=utf-8")
            if url.path == "/api/status":
                return self.send(200, P.status())
            if url.path == "/api/discover":
                return self.send(200, discover())
            if url.path == "/api/apps":
                return self.need_device() and self.send(200, P.apps())
            if url.path == "/api/screen":
                if not self.need_device():
                    return
                png = P.screenshot()
                if not png.startswith(b"\x89PNG"):
                    return self.send(502, {"error": "No se pudo capturar la pantalla"})
                return self.send(200, png, "image/png")
            self.send(404, {"error": "no encontrado"})
        except subprocess.TimeoutExpired:
            self.send(504, {"error": "El proyector no respondió a tiempo"})
        except FileNotFoundError:
            self.send(500, {"error": f"No encuentro adb ({ADB}). Instala Android platform-tools."})

    def do_POST(self):
        url = urlparse(self.path)
        b = self.body()
        try:
            if url.path == "/api/connect":
                ok, out = P.connect(b.get("host", ""))
                return self.send(200 if ok else 400, {"ok": ok, "message": out})
            if not self.need_device():
                return
            if url.path == "/api/key":
                return self.send(200, {"ok": P.key(b.get("key", ""), b.get("long", False))})
            if url.path == "/api/text":
                return self.send(200, {"ok": P.text(b.get("text", ""))})
            if url.path == "/api/tap":
                return self.send(200, {"ok": P.tap(float(b["x"]), float(b["y"]))})
            if url.path == "/api/swipe":
                return self.send(200, {"ok": P.swipe(*(float(b[k]) for k in ("x1", "y1", "x2", "y2")))})
            if url.path == "/api/launch":
                return self.send(200, {"ok": P.launch(b.get("package", ""))})
            if url.path == "/api/url":
                return self.send(200, {"ok": True, "message": P.open_url(b.get("url", ""))})
            if url.path == "/api/volume":
                v = int(b.get("value", 0))
                P.sh(f"cmd media_session volume --set {v} --stream 3 2>/dev/null || media volume --set {v} --stream 3")
                return self.send(200, {"ok": True, "volume": P.volume()})
            if url.path == "/api/shell":  # avanzado: comando libre
                return self.send(200, {"output": P.sh(b.get("cmd", ""), timeout=15)})
            self.send(404, {"error": "no encontrado"})
        except subprocess.TimeoutExpired:
            self.send(504, {"error": "El proyector no respondió a tiempo"})
        except FileNotFoundError:
            self.send(500, {"error": f"No encuentro adb ({ADB}). Instala Android platform-tools."})


def main():
    if not shutil.which(ADB) and not Path(ADB).exists():
        print(f"⚠  No encuentro 'adb'. Instálalo (Android platform-tools) o define ADB=/ruta/adb", file=sys.stderr)
    host = os.environ.get("HOST", "127.0.0.1")
    srv = ThreadingHTTPServer((host, PORT), Handler)
    print(f"\n  Wanbo Remote listo →  http://localhost:{PORT}\n")
    if host == "0.0.0.0":
        print(f"  Desde tu móvil:       http://{local_ip()}:{PORT}\n")
    if P.serial:
        threading.Thread(target=P.connect, args=(P.serial,), daemon=True).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        P.close_shell()


if __name__ == "__main__":
    main()
