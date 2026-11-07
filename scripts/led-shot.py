# Offline bulb-wall renderer + layout auditor.
# Reads plans from scripts/led-shot.mjs, paints the exact HZK16/ASC16 bitmaps
# into a bulb grid (1 cell = 1 pixel), saves PNGs, and reports text-prims
# whose glyph boxes overlap - the same collisions a human sees on the wall.
import json
import struct
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
HDR = 16


def load_lamp():
    data = (ROOT / "assets" / "lamp.bin").read_bytes()
    assert data[:4] == b"MLLP", "bad lamp.bin"
    asc_len, hz_len = struct.unpack_from("<II", data, 4)
    asc = data[HDR:HDR + asc_len]
    hz = data[HDR + asc_len:HDR + asc_len + hz_len]
    cmap = data[HDR + asc_len + hz_len:]
    return asc, hz, cmap


def glyph(code, asc, hz, cmap):
    # returns (width_cells_including_1_gap, rows of bit-strings) for std 16x16
    if code < 0x100:
        o = code * 16
        rows = [f"{asc[o + r]:08b}" for r in range(16)]
        return 9, rows
    if code * 2 + 1 < len(cmap):
        cell = struct.unpack_from("<H", cmap, code * 2)[0]
        off = (cell - 1) * 32 if cell > 0 else -1
        if off >= 0 and off + 32 <= len(hz):
            rows = []
            for r in range(16):
                b = (hz[off + r * 2] << 8) | hz[off + r * 2 + 1]
                rows.append(f"{b:016b}")
            return 17, rows
    return 9, [""] * 16


def text_w(s):
    return sum(17 if ord(ch) > 255 else 9 for ch in s)


def draw_text(buf, x, y, s, color, asc, hz, cmap):
    cx = x
    for ch in s:
        w, rows = glyph(ord(ch), asc, hz, cmap)
        for ry, bits in enumerate(rows):
            for rx, bit in enumerate(bits):
                if bit == "1" and 0 <= y + ry < len(buf) and 0 <= cx + rx < len(buf[0]):
                    buf[y + ry][cx + rx] = color
        cx += w


def hex2rgb(c):
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def audit(plan):
    # collect glyph boxes; two texts collide when their boxes intersect by
    # >= 4 rows vertically and >= 1 cell horizontally
    boxes = []
    for p in plan["prims"]:
        if p["t"] != "x":
            continue
        w = text_w(p["s"])
        x0 = p["x"] // 2 if p["r"] is None else p["r"] // 2 - w
        boxes.append((x0, x0 + w, p["y"] // 2, p["y"] // 2 + 16, p["s"]))
    hits = []
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            a, b = boxes[i], boxes[j]
            oy = min(a[3], b[3]) - max(a[2], b[2])
            ox = min(a[1], b[1]) - max(a[0], b[0])
            if oy >= 4 and ox >= 1:
                hits.append((a[4], b[4], ox, max(a[0], b[0]) * 2, a[2] * 2))
    return hits


def main():
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "shots"
    asc, hz, cmap = load_lamp()
    total = 0
    for js in sorted(out.glob("plan-*.json")):
        plan = json.loads(js.read_text(encoding="utf-8"))
        w, h = plan["w"] // 2, plan["h"] // 2
        buf = [[(5, 8, 15)] * w for _ in range(h)]
        for p in plan["prims"]:
            if p["t"] == "f":
                rgb = hex2rgb(p["c"])
                for y in range(p["y"] // 2, min(h, (p["y"] + p["h"]) // 2)):
                    for x in range(p["x"] // 2, min(w, (p["x"] + p["w"]) // 2)):
                        buf[y][x] = rgb
        for p in plan["prims"]:
            if p["t"] == "x":
                x0 = p["x"] // 2 if p["r"] is None else p["r"] // 2 - text_w(p["s"])
                draw_text(buf, x0, p["y"] // 2, p["s"], hex2rgb(p["c"]), asc, hz, cmap)
        img = Image.new("RGB", (w, h))
        for y in range(h):
            for x in range(w):
                img.putpixel((x, y), buf[y][x])
        img = img.resize((w * 2, h * 2), Image.NEAREST)
        name = out / f"{js.stem.replace('plan', 'shot')}.png"
        img.save(name)
        hits = audit(plan)
        total += len(hits)
        print(f"{js.name}: shot -> {name.name}, {len(hits)} collision(s)")
        for a, b, ox, cx, cy in hits[:12]:
            print(f"  COLLIDE '{a}' vs '{b}' by {ox}px at x={cx} y={cy}")
    print("TOTAL collisions:", total)
    return 1 if total else 0


if __name__ == "__main__":
    raise SystemExit(main())
