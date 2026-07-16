#!/usr/bin/env python3
"""Trim white screenshot margins from rendered Kanni diagrams."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops


def autocrop(path: Path, pad: int) -> tuple[int, int]:
    image = Image.open(path).convert("RGB")
    background = Image.new("RGB", image.size, (255, 255, 255))
    bounding_box = ImageChops.difference(image, background).getbbox()
    if bounding_box:
        left, top, right, bottom = bounding_box
        image = image.crop(
            (
                max(0, left - pad),
                max(0, top - pad),
                min(image.width, right + pad),
                min(image.height, bottom + pad),
            )
        )
    image.save(path)
    return image.size


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="+", help="PNG files to crop in place")
    parser.add_argument("--pad", type=int, default=10, help="white padding to keep")
    arguments = parser.parse_args()
    for filename in arguments.files:
        path = Path(filename)
        width, height = autocrop(path, arguments.pad)
        print(f"{path.name:32} -> {width}x{height}")


if __name__ == "__main__":
    main()
