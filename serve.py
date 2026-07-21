"""
Servidor de desenvolvimento do awwwards-kit.

Igual ao `python -m http.server`, mas manda no-cache em tudo — assim o
browser NUNCA serve CSS/JS velho depois de você editar. (Sem isso o Chrome
guarda o motion.js em cache e você fica olhando pra um bug já corrigido.)

    python serve.py            # porta 5599
    python serve.py 8080       # porta custom
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):          # log enxuto
        sys.stderr.write("  %s\n" % (fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5599
    print(f"awwwards-kit  ->  http://localhost:{port}   (no-cache ligado, Ctrl+C pra parar)")
    ThreadingHTTPServer(("", port), NoCacheHandler).serve_forever()
