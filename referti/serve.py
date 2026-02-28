#!/usr/bin/env python3
import http.server
import socketserver
import os

os.chdir('/home/user/bio-clinic/referti/public')
PORT = 8080
Handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(('0.0.0.0', PORT), Handler) as httpd:
    print(f'Serving at port {PORT} from {os.getcwd()}', flush=True)
    httpd.serve_forever()
