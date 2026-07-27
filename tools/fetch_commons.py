#!/usr/bin/env python3
"""
Fetch card art from Wikimedia Commons.

Two modes, chosen by --mode:

  photo   download a raster thumbnail, centre-crop to a square, save as
          img/<level>/<id>.jpg at 640x640 (matches every existing level)
  svg     download the SVG untouched, save as img/<level>/<id>.svg
          (flags — vector art stays crisp at any board size)

Input is a JSON file: [{"id": "japan", "file": "Flag of Japan.svg"}, ...]
An optional "focus" key (0.0-1.0) shifts a photo's square crop vertically;
0.5 is centred, lower keeps more of the top (right for portraits).

Licences are checked, not assumed. Anything that is not public domain,
CC0, PD-Mark or a CC BY / CC BY-SA variant is refused, so a card can
never ship with art we are not allowed to reuse.

Writes a credits sidecar next to the images: img/<level>/_credits.json,
holding the licence and author of every file for CREDITS.md.

Usage:
  python3 tools/fetch_commons.py --level flags-world --mode svg  --list /tmp/w.json
  python3 tools/fetch_commons.py --level landmarks   --mode photo --list /tmp/l.json
"""

import argparse
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = "WonderflipBot/1.0 (childrens educational memory game; contact: repo maintainer)"

# Licence short names we accept. Everything else is refused.
OK_LICENCE = re.compile(
    r"^(public domain|pd-\w+|cc0|cc by(-sa)?[\s-]?[\d.]*( \w+)?)$", re.I
)

SIZE = 640          # final square edge, matching the existing levels
THUMB = 1280        # ask Commons for this wide, then crop down


def api(params):
    """One Commons API call, with a couple of polite retries."""
    params = {**params, "format": "json", "formatversion": "2"}
    url = f"{API}?{urllib.parse.urlencode(params)}"
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=45) as r:
                return json.load(r)
        except Exception as exc:                      # noqa: BLE001
            if attempt == 2:
                raise
            print(f"    retry after {exc}", file=sys.stderr)
            time.sleep(2 * (attempt + 1))
    return None


def strip_html(s):
    """extmetadata values arrive as little HTML fragments."""
    if not s:
        return ""
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"&amp;", "&", s)
    s = re.sub(r"&[a-z]+;", " ", s)
    return " ".join(s.split()).strip()


def lookup(filename, want_width):
    """Resolve a Commons file to a URL plus its licence metadata."""
    data = api({
        "action": "query",
        "titles": f"File:{filename}",
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|mime",
        "iiurlwidth": want_width,
    })
    pages = data.get("query", {}).get("pages", [])
    if not pages or "imageinfo" not in pages[0]:
        raise LookupError(f"no such file on Commons: {filename}")

    info = pages[0]["imageinfo"][0]
    meta = info.get("extmetadata", {})
    licence = strip_html(meta.get("LicenseShortName", {}).get("value", ""))
    author = strip_html(meta.get("Artist", {}).get("value", "")) or "Unknown"

    if not OK_LICENCE.match(licence):
        raise PermissionError(f"licence not reusable ({licence or 'unknown'})")

    return {
        "url": info["url"],
        "thumb": info.get("thumburl", info["url"]),
        "mime": info.get("mime", ""),
        "licence": licence,
        "author": author,
        "page": info.get("descriptionurl", ""),
    }


def download(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read()


def save_photo(raw, dest, focus):
    """Centre-crop to a square and write a 640x640 progressive JPEG."""
    from PIL import Image

    im = Image.open(io.BytesIO(raw))
    im = im.convert("RGB")
    w, h = im.size
    edge = min(w, h)

    left = (w - edge) // 2
    # focus 0.0 = top of frame, 1.0 = bottom. Portraits want the face,
    # which sits above the middle, so callers pass something near 0.35.
    top = int((h - edge) * focus)
    top = max(0, min(h - edge, top))

    im = im.crop((left, top, left + edge, top + edge))
    im = im.resize((SIZE, SIZE), Image.LANCZOS)
    im.save(dest, "JPEG", quality=82, optimize=True, progressive=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--level", required=True, help="folder under img/")
    ap.add_argument("--mode", required=True, choices=["photo", "svg"])
    ap.add_argument("--list", required=True, help="JSON list of {id, file}")
    args = ap.parse_args()

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    outdir = os.path.join(root, "img", args.level)
    os.makedirs(outdir, exist_ok=True)

    with open(args.list, encoding="utf-8") as fh:
        items = json.load(fh)

    credits, failed = [], []

    for item in items:
        cid, filename = item["id"], item["file"]
        ext = "svg" if args.mode == "svg" else "jpg"
        dest = os.path.join(outdir, f"{cid}.{ext}")
        print(f"  {cid:<22} {filename}")

        try:
            info = lookup(filename, THUMB)

            if args.mode == "svg":
                if "svg" not in info["mime"]:
                    raise ValueError(f"not an SVG ({info['mime']})")
                raw = download(info["url"])
                if b"<svg" not in raw[:4096]:
                    raise ValueError("payload is not SVG markup")
                with open(dest, "wb") as fh:
                    fh.write(raw)
            else:
                raw = download(info["thumb"])
                save_photo(raw, dest, float(item.get("focus", 0.5)))

            credits.append({
                "id": cid,
                "file": filename,
                "licence": info["licence"],
                "author": info["author"],
                "page": info["page"],
            })
            print(f"    ok  {info['licence']} — {info['author'][:60]}")

        except Exception as exc:                      # noqa: BLE001
            print(f"    FAIL {exc}", file=sys.stderr)
            failed.append({"id": cid, "file": filename, "why": str(exc)})

        time.sleep(0.4)                               # be kind to Commons

    with open(os.path.join(outdir, "_credits.json"), "w", encoding="utf-8") as fh:
        json.dump(credits, fh, indent=2, ensure_ascii=False)

    print(f"\n{len(credits)} saved, {len(failed)} failed → {outdir}")
    if failed:
        print("failures:")
        for f in failed:
            print(f"  {f['id']}: {f['why']}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
