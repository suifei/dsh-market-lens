# Offline bulb-wall renderer + layout auditor.
# Reads plans from scripts/led-shot.mjs, paints the exact HZK16/ASC16 bitmaps
# onto a content canvas, then bakes it into a bulb grid the same way the
# browser does (PITCH px lattice, 3px bulb, 0.5px seam), saves PNGs, and
# reports text-prims whose glyph boxes overlap - the collisions a human sees.
import json
import struct
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
HDR = 16
PITCH = 3.5
BULB = 3
OFF_BG = (5, 8, 15)
OFF_BULB = (22, 44, 68)  # rgba(24,48,74,0.9) over OFF_BG


def LPX(v):
    return int(round(v))


def load_lamp():
    data = (ROOT / "assets" / "lamp.bin").read_bytes()
    assert data[:4] == b"MLLP", "bad lamp.bin"
    asc_len, hz_len = struct.unpack_from("<II", data, 4)
    asc = data[HDR:HDR + asc_len]
    hz = data[HDR + asc_len:HDR + asc_len + hz_len]
    cmap = data[HDR + asc_len + hz_len:]
    return asc, hz, cmap


def glyph(code, asc, hz, cmap):
    if code < 0x100:
        o = code * 16
        return 9, [f"{asc[o + r]:08b}" for r in range(16)]
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


def hex2rgb(c):
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def blend(bg, fg, a):
    return tuple(int(b * (1 - a) + f * a) for b, f in zip(bg, fg))


def draw_content(plan, asc, hz, cmap):
    img = Image.new("RGB", (plan["w"], plan["h"]), OFF_BG)
    for p in plan["prims"]:
        if p["t"] == "f":
            rgb = hex2rgb(p["c"])
            a = p.get("a")
            a = 1.0 if a is None else float(a)
            for y in range(p["y"], p["y"] + p["h"]):
                for x in range(p["x"], p["x"] + p["w"]):
                    if 0 <= y < plan["h"] and 0 <= x < plan["w"]:
                        img.putpixel((x, y), blend(img.getpixel((x, y)), rgb, a))
    for p in plan["prims"]:
        if p["t"] != "x":
            continue
        w = text_w(p["s"])
        x0 = p["x"] if p["r"] is None else p["r"] - w * PITCH
        rgb = hex2rgb(p["c"])
        px = x0
        for ch in p["s"]:
            gw, rows = glyph(ord(ch), asc, hz, cmap)
            for ry, bits in enumerate(rows):
                for rx, bit in enumerate(bits):
                    if bit == "1":
                        bx, by = LPX(px + rx * PITCH), LPX(p["y"] + ry * PITCH)
                        for dy in range(BULB):
                            for dx in range(BULB):
                                if 0 <= by + dy < plan["h"] and 0 <= bx + dx < plan["w"]:
                                    img.putpixel((bx + dx, by + dy), rgb)
            px += gw * PITCH
    return img


def bake(img):
    w, h = img.size
    out = Image.new("RGB", (w, h), OFF_BG)
    cols = range(0, LPX(w / PITCH) + 1)
    for cy in range(0, LPX(h / PITCH) + 1):
        gy = LPX(cy * PITCH)
        for cx in cols:
            gx = LPX(cx * PITCH)
            if gx + BULB > w or gy + BULB > h:
                continue
            # max-channel sample like bakeLamps: any lit dot in the footprint lights the bulb
            best = None
            lum = 0
            for dy in range(BULB):
                for dx in range(BULB):
                    r, g, b = img.getpixel((gx + dx, gy + dy))[:3]
                    m = max(r, g, b)
                    if m > lum:
                        lum = m
                        best = (r, g, b)
            col = best if (best is not None and lum > 12) else OFF_BULB
            for dy in range(BULB):
                for dx in range(BULB):
                    out.putpixel((gx + dx, gy + dy), col)
    return out


def audit(plan):
    boxes = []
    for p in plan["prims"]:
        if p["t"] != "x":
            continue
        w = text_w(p["s"])
        x0 = LPX(p["x"] / PITCH) if p["r"] is None else LPX(p["r"] / PITCH) - w
        boxes.append((x0, x0 + w, LPX(p["y"] / PITCH), LPX(p["y"] / PITCH) + 16, p["s"]))
    hits = []
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            a, b = boxes[i], boxes[j]
            oy = min(a[3], b[3]) - max(a[2], b[2])
            ox = min(a[1], b[1]) - max(a[0], b[0])
            if oy >= 4 and ox >= 1:
                hits.append((a[4], b[4], ox, max(a[0], b[0]) * PITCH, a[2] * PITCH))
    return hits


def main():
    global PITCH, BULB
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "shots"
    asc, hz, cmap = load_lamp()
    total = 0
    for js in sorted(out.glob("plan-*.json")):
        plan = json.loads(js.read_text(encoding="utf-8"))
        lat = plan.get("lattice") or {}
        PITCH = float(lat.get("P", 3.5))
        BULB = int(lat.get("bulb", 3))
        plan["w"] = int(round(plan["w"]))
        plan["h"] = int(round(plan["h"]))
        for p in plan["prims"]:
            for k in ("x", "y", "r", "w", "h"):
                if isinstance(p.get(k), (int, float)):
                    p[k] = int(round(p[k]))
        content = draw_content(plan, asc, hz, cmap)
        img = bake(content)
        img = img.resize((img.width * 2, img.height * 2), Image.NEAREST)
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
