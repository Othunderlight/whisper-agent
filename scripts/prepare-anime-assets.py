#!/usr/bin/env python3
"""Convert white-background anime pose JPEGs into transparent PNGs.

Usage: python3 scripts/prepare-anime-assets.py [characters_dir]
New poses dropped into apps/desktop/src/assets/anime/characters/ can be processed
by re-running this script. Existing PNGs are skipped unless --force is passed.
"""
from __future__ import annotations

import argparse
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

DEFAULT_DIR = Path(__file__).resolve().parent.parent / "apps/desktop/src/assets/anime/characters"


def cutout(source: Path, destination: Path, tolerance: int) -> None:
    image = Image.open(source).convert("RGB")
    width, height = image.size
    pixels = np.asarray(image).astype(np.int16)
    near_white = pixels.min(axis=2) >= 255 - tolerance

    visited = np.zeros((height, width), dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    def seed(x: int, y: int) -> None:
        if near_white[y, x] and not visited[y, x]:
            visited[y, x] = True
            queue.append((x, y))

    for x in range(width):
        seed(x, 0)
        seed(x, height - 1)
    for y in range(height):
        seed(0, y)
        seed(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height:
                if near_white[ny, nx] and not visited[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((nx, ny))

    alpha = np.where(visited, 0, 255).astype(np.uint8)
    rgba = np.dstack([pixels.astype(np.uint8), alpha])
    Image.fromarray(rgba, "RGBA").save(destination, optimize=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("directory", nargs="?", type=Path, default=DEFAULT_DIR)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--tolerance", type=int, default=32)
    args = parser.parse_args()

    if not args.directory.is_dir():
        print(f"Directory not found: {args.directory}", file=sys.stderr)
        return 1

    converted = 0
    for source in sorted(args.directory.glob("*.jpg")):
        destination = source.with_suffix(".png")
        if destination.exists() and not args.force:
            continue
        cutout(source, destination, args.tolerance)
        converted += 1
        print(f"{source.name} -> {destination.name}")

    print(f"Processed {converted} image(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
