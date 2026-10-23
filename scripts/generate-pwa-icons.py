#!/usr/bin/env python3
"""
scripts/generate-pwa-icons.py
Generates all PWA app icons and favicons from src/assets/Receipt-Stack-Dollar-Icon.svg
"""

import os
import subprocess
from PIL import Image

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG_SRC = os.path.join(REPO_ROOT, "src", "assets", "Receipt-Stack-Dollar-Icon.svg")
PUBLIC_DIR = os.path.join(REPO_ROOT, "public")
TEMP_SVG = "/tmp/ledger-icon-white.svg"
TEMP_PNG = "/tmp/ledger-glyph-1024.png"

# Read original SVG and generate white-fill version
with open(SVG_SRC, "r") as f:
    svg_content = f.read()

white_svg = svg_content.replace('fill="#000000"', 'fill="#ffffff"')
with open(TEMP_SVG, "w") as f:
    f.write(white_svg)

# Render white glyph at high resolution (1024x1024)
subprocess.run(["rsvg-convert", "-w", "1024", "-h", "1024", TEMP_SVG, "-o", TEMP_PNG], check=True)

glyph_raw = Image.open(TEMP_PNG).convert("RGBA")
bbox = glyph_raw.getbbox()
glyph = glyph_raw.crop(bbox)

# Brand dark background: #09090b (matches theme_color and background_color)
BG_COLOR = (9, 9, 11)

def create_icon(canvas_size: int, glyph_scale: float, bg_color=BG_COLOR) -> Image.Image:
    target_dim = int(canvas_size * glyph_scale)
    aspect = glyph.width / glyph.height
    if aspect >= 1.0:
        gw = target_dim
        gh = int(target_dim / aspect)
    else:
        gh = target_dim
        gw = int(target_dim * aspect)

    resized_glyph = glyph.resize((gw, gh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (canvas_size, canvas_size), bg_color + (255,))
    ox = (canvas_size - gw) // 2
    oy = (canvas_size - gh) // 2
    canvas.paste(resized_glyph, (ox, oy), resized_glyph)
    return canvas

# 1. maskable-icon.png (512x512, safe-zone glyph scale 0.64 for 80% circle safety)
maskable = create_icon(512, 0.64)
maskable.convert("RGB").save(os.path.join(PUBLIC_DIR, "maskable-icon.png"), "PNG")

# 2. logo-512.png (512x512, glyph scale 0.72)
logo512 = create_icon(512, 0.72)
logo512.convert("RGBA").save(os.path.join(PUBLIC_DIR, "logo-512.png"), "PNG")

# 3. logo-192.png (192x192, glyph scale 0.72)
logo192 = create_icon(192, 0.72)
logo192.convert("RGBA").save(os.path.join(PUBLIC_DIR, "logo-192.png"), "PNG")

# 4. apple-touch-icon.png (180x180, glyph scale 0.72)
apple_icon = create_icon(180, 0.72)
apple_icon.convert("RGB").save(os.path.join(PUBLIC_DIR, "apple-touch-icon.png"), "PNG")

# 5. favicon.ico (16, 32, 48)
fav = create_icon(64, 0.75)
fav.save(os.path.join(PUBLIC_DIR, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])

print("✅ Generated all PWA icons and favicons successfully from Receipt-Stack-Dollar-Icon.svg!")
