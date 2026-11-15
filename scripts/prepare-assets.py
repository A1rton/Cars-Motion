"""Prepare the user-supplied CarsMotion artwork for the homepage.

Usage: python scripts/prepare-assets.py [source-folder]
Requires Pillow with WebP support. Images are resized proportionally without
cropping, retouching, filters or changes to their depicted vehicles.
"""
from pathlib import Path
import hashlib
import json
import shutil
import sys
from PIL import Image, ImageOps

project = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "Downloads"
destination = project / "public" / "media"
destination.mkdir(parents=True, exist_ok=True)
items = [
    ("logo", "Chrome CarsMotion Sports Car Logo.png"),
    ("mustang", "Winter Mustang on Manhattan’s Wet Streets.png"),
    ("porsche-alpine", "Silver Porsche on a Misty Alpine Road.png"),
    ("lexus", "Lexus LS 300h Along the Rainy Coast.png"),
    ("bmw", "BMW SUV on a Rainy City Road.png"),
    ("mercedes", "Mercedes A200 on a Misty Mountain Road.png"),
    ("porsche-sunset", "Sunset Porsche on Mountain Roads.png"),
]

def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

manifest = {
    "provenance": "Artwork supplied by the user for this CarsMotion homepage.",
    "notice": "These are presentation images, not evidence of vehicle stock or exact specifications. Original filenames are preserved as provenance, not verified model identification.",
    "processing": "Proportional resizing and WebP export only; no cropping, retouching, compositing or color filters. Logo transparency preserved.",
    "assets": [],
}
for identifier, name in items:
    original = source / name
    with Image.open(original) as opened:
        image = ImageOps.exif_transpose(opened).copy()
    entry = {
        "id": identifier, "originalFilename": name,
        "source": "user supplied", "originalSha256": sha256(original),
        "originalWidth": image.width, "originalHeight": image.height,
        "originalMode": image.mode, "variants": [],
    }
    if identifier == "logo":
        image = image.convert("RGBA")
        alpha = image.getchannel("A")
        entry["alphaRange"] = list(alpha.getextrema())
        entry["visibleBounds"] = list(alpha.getbbox() or (0, 0, image.width, image.height))
        path = destination / "logo.webp"
        image.save(path, "WEBP", lossless=True, method=6, exact=True)
        entry["variants"].append({"file": path.name, "width": image.width, "height": image.height, "bytes": path.stat().st_size, "sha256": sha256(path)})
        png = destination / "logo.png"
        shutil.copyfile(original, png)
        entry["variants"].append({"file": png.name, "width": image.width, "height": image.height, "bytes": png.stat().st_size, "sha256": sha256(png), "note": "Unmodified original PNG; preferred compatibility asset for the logo."})
    else:
        image = image.convert("RGB")
        for width in (800, 1600):
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            path = destination / f"{identifier}-{width}.webp"
            resized.save(path, "WEBP", quality=88, method=6)
            entry["variants"].append({"file": path.name, "width": width, "height": height, "bytes": path.stat().st_size, "sha256": sha256(path)})
    manifest["assets"].append(entry)

(destination / "sources.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
for asset in manifest["assets"]:
    print(asset["id"], f'{asset["originalWidth"]}x{asset["originalHeight"]}', asset.get("alphaRange", "opaque"), asset.get("visibleBounds", ""), sum(v["bytes"] for v in asset["variants"]))
print("Total delivered media bytes:", sum(v["bytes"] for a in manifest["assets"] for v in a["variants"]))
