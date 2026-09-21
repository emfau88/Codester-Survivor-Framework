from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = PROJECT_ROOT / "art-source" / "map" / "generated"
ART_ROOT = PROJECT_ROOT / "art-source" / "map"
RUNTIME_ROOT = PROJECT_ROOT / "src" / "assets" / "map"
TARGET_SIZE = (300, 600)
SEAM_BLEND_HEIGHT = 54


def make_vertical_seam(image: Image.Image) -> Image.Image:
    output = image.convert("RGB").resize(TARGET_SIZE, Image.Resampling.LANCZOS)
    pixels = output.load()
    width, height = output.size
    for y in range(SEAM_BLEND_HEIGHT):
        opposite_y = height - 1 - y
        strength = (1 - y / SEAM_BLEND_HEIGHT) ** 2
        for x in range(width):
            top = pixels[x, y]
            bottom = pixels[x, opposite_y]
            common = tuple(round((top[channel] + bottom[channel]) / 2) for channel in range(3))
            pixels[x, y] = tuple(
                round(top[channel] * (1 - strength) + common[channel] * strength)
                for channel in range(3)
            )
            pixels[x, opposite_y] = tuple(
                round(bottom[channel] * (1 - strength) + common[channel] * strength)
                for channel in range(3)
            )
    return output


def export(side: str) -> None:
    source_path = SOURCE_ROOT / f"feed-alley-{side}-seamless-source.png"
    output = make_vertical_seam(Image.open(source_path))
    output.save(ART_ROOT / f"arena-feed-alley-{side}.png", optimize=True)
    output.save(
        RUNTIME_ROOT / f"arena-feed-alley-{side}.webp",
        "WEBP",
        quality=88,
        method=6,
    )


for map_side in ("left", "right"):
    export(map_side)
