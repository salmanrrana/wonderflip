#!/usr/bin/env python3
"""
Turn the _credits.json sidecars that fetch_commons.py leaves in each
img/<level>/ folder into a markdown block for CREDITS.md.

Prints to stdout; paste or redirect into the credits file.

  python3 tools/build_credits.py flags-world flags-usa landmarks instruments explorers
"""

import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# a credit line is a name, not an essay — Commons author fields ramble
MAX_AUTHOR = 90

TITLES = {
    "flags-world": "World Flags",
    "flags-usa": "State Flags",
    "landmarks": "World Landmarks",
    "instruments": "Musical Instruments",
    "explorers": "Explorers",
}


def tidy(author):
    """Commons author fields are raw HTML — links, <bdi>, styled divs, the lot.

    Strip it back to plain text so the credit line reads like a name rather
    than like markup. Anything left over that is still HTML-ish, or one of
    Commons' "unknown author" placeholders, becomes a plain "Unknown".
    """
    author = author or ""
    author = re.sub(r"<br\s*/?>", " ", author, flags=re.I)   # keep multi-author spacing
    author = re.sub(r"<[^>]+>", "", author)                  # drop every remaining tag
    author = html.unescape(author)
    author = re.sub(r"\s+", " ", author).strip()
    # a bare wiki username reads better without the namespace
    author = re.sub(r"^User:", "", author)
    author = author.strip(" -–—,;")

    # Commons boilerplate that says nothing about who made the image
    author = re.sub(r"The SVG code is valid\.?", "", author, flags=re.I)
    author = re.sub(r"This (vector image|flag|W3C-unspecified \w+) was created with \w+"
                    r"(\s+by\s+)?", r"\2", author, flags=re.I)
    author = re.sub(r"See File history below for details\.?", "", author, flags=re.I)
    author = re.sub(r"\s+", " ", author).strip(" -–—,;.")

    if not author or re.fullmatch(r"[?]+|(unknown|unknown author|anonymous|various|n/?a)\.?",
                                  author, re.I):
        return "Unknown"

    # Some author fields run to a paragraph — flag specifications, colour
    # notes, edit histories. Cap the length rather than splitting on
    # sentences: "George F. G. Stanley" and "Paul B. Johnson" would lose
    # their surnames to any full-stop rule.
    if len(author) > MAX_AUTHOR:
        author = author[:MAX_AUTHOR].rsplit(" ", 1)[0] + " …"
    return author.strip(" -–—,;")


def card_names(level):
    """Map card id -> display name by reading the level's data file.

    The id alone makes a poor credit line: "Bird" and "Bly" say much less
    than "Isabella Bird" and "Nellie Bly". Falls back to the prettified id
    when the data file cannot be parsed.
    """
    path = os.path.join(ROOT, "data", f"{level}.js")
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        src = fh.read()
    # id and name sit next to each other in every card literal
    pairs = re.findall(r"id:\s*'([^']+)'\s*,\s*name:\s*'([^']*)'", src)
    return dict(pairs)


def main(levels):
    for level in levels:
        names = card_names(level)
        path = os.path.join(ROOT, "img", level, "_credits.json")
        if not os.path.exists(path):
            print(f"<!-- no _credits.json for {level} -->\n", file=sys.stderr)
            continue

        with open(path, encoding="utf-8") as fh:
            rows = json.load(fh)

        print(f"## {TITLES.get(level, level)}\n")

        licences = {r["licence"] for r in rows}
        if licences == {"Public domain"}:
            print(f"All {len(rows)} images are **public domain**, from Wikimedia Commons.\n")
        else:
            print(f"All {len(rows)} images are from Wikimedia Commons, "
                  "under the licences listed.\n")

        # same column order as the hand-written sections above
        print("| Card | Title | Author | License | Source |")
        print("|---|---|---|---|---|")
        for r in sorted(rows, key=lambda r: r["id"]):
            name = names.get(r["id"]) or r["id"].replace("-", " ").title()
            title = r["file"].rsplit(".", 1)[0]
            link = f"[link]({r['page']})" if r.get("page") else "—"
            print(f"| {name} | {title} | {tidy(r['author'])} | {r['licence']} | {link} |")
        print()


if __name__ == "__main__":
    main(sys.argv[1:] or list(TITLES))
