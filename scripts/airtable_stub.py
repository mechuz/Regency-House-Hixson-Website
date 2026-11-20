"""Local stand-in for the Airtable REST API used when publish_from_airtable.py
runs without an AIRTABLE_TOKEN (the marketing agent exports the rows through the
Airtable connector into blog.json / news.json in the working directory). GET
list/get are served from those files; PATCH is appended to patches.jsonl so the
same updates can be applied through the connector afterwards.

    python3 scripts/airtable_stub.py 8765 &
    AIRTABLE_API_URL=http://127.0.0.1:8765/v0 AIRTABLE_TOKEN=local python3 scripts/publish_from_airtable.py prepare
"""
import json, sys, urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer

def norm(v):
    if isinstance(v, dict) and 'name' in v: return v['name']
    if isinstance(v, list):
        if v and all(isinstance(x, dict) and 'id' in x and 'name' in x and x['id'].startswith('rec') for x in v): return [x['id'] for x in v]
        if v and all(isinstance(x, dict) and 'name' in x for x in v): return [x['name'] for x in v]
    return v

def load(path):
    d = json.load(open(path))
    return [{"id": r["id"], "createdTime": r.get("createdTime"), "fields": {k: norm(v) for k, v in r["cellValuesByFieldId"].items()}} for r in d["records"]]

TABLES = {
    "tblSFfvC2sMyfpjKR": load("blog.json"),
    "tbl7fndFitE6ObJ4L": load("news.json"),
    "tbl2kgdwv5SgogY5v": [
        {"id": "recWfp5kwvUuLuDKt", "fields": {"fld87wvkCwlENyXQ6": "Approved", "fldabV0gpDG2dkgQH": "https://www.hixsonregencyhouse.com/assets/img/entry.webp"}},
        {"id": "rectEEPlMaMibUNzL", "fields": {"fld87wvkCwlENyXQ6": "Approved", "fldabV0gpDG2dkgQH": "https://www.hixsonregencyhouse.com/assets/img/exterior-front.webp"}},
        {"id": "recnCgorJIgP0gz3O", "fields": {"fld87wvkCwlENyXQ6": "Approved", "fldabV0gpDG2dkgQH": "https://www.hixsonregencyhouse.com/assets/img/respite-suite.webp"}},
        {"id": "recYx8DDgx37tV90o", "fields": {"fld87wvkCwlENyXQ6": "Approved", "fldabV0gpDG2dkgQH": "https://www.hixsonregencyhouse.com/assets/img/apartment.webp"}},
    ],
    "tbloItRRgsodfBCnE": [
        {"id": "recJ0heJ9gfuojaKb", "fields": {"fldktq6od1qYWRLeS": "Signs it may be time for assisted living: medications, falls, meals and the exhausted caregiver"}},
        {"id": "rectnSf4IhN0OeJiO", "fields": {"fldktq6od1qYWRLeS": "How to choose an assisted living community in Hixson and Chattanooga: a family checklist"}},
        {"id": "recmgdHM70mz606Ik", "fields": {"fldktq6od1qYWRLeS": "Respite care in Chattanooga: how a short stay gives family caregivers a break"}},
        {"id": "recrwmVWPtC25f7oC", "fields": {"fldktq6od1qYWRLeS": "What an all-inclusive monthly rate means and how to compare communities that charge by care level"}},
    ],
}

import os
for _name, _tbl in (("photos.json", "tbl2kgdwv5SgogY5v"), ("topics.json", "tbloItRRgsodfBCnE")):
    if os.path.exists(_name):
        _have = {r["id"] for r in TABLES[_tbl]}
        TABLES[_tbl] += [r for r in load(_name) if r["id"] not in _have]


class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, code, obj):
        b = json.dumps(obj).encode(); self.send_response(code)
        self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(b)))
        self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        parts = urllib.parse.urlsplit(self.path).path.strip("/").split("/")   # v0/base/table[/rec]
        tbl = TABLES.get(parts[2], [])
        if len(parts) == 4:
            for r in tbl:
                if r["id"] == parts[3]: return self._send(200, r)
            return self._send(404, {"error": "NOT_FOUND"})
        self._send(200, {"records": tbl})
    def do_PATCH(self):
        parts = urllib.parse.urlsplit(self.path).path.strip("/").split("/")
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0)) or 0) or b"{}")
        with open("patches.jsonl", "a") as fh: fh.write(json.dumps({"table": parts[2], "id": parts[3], "fields": body.get("fields", {})}) + "\n")
        self._send(200, {"id": parts[3], "fields": body.get("fields", {})})

HTTPServer(("127.0.0.1", int(sys.argv[1])), H).serve_forever()
