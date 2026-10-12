"""Bake the golf ball's surface: a dimple normal map and a colour map.

392 dimples (a common real-world count) are spread evenly over the sphere
with a Fibonacci lattice. Each dimple is a shallow spherical cup; the height
field is baked into equirectangular maps that three.js wraps onto a sphere.

Outputs: public/advert/ball-normal.png, public/advert/ball-color.png
Usage: python3 scripts/advert/golf_ball_maps.py
"""

import pathlib

import numpy as np
from PIL import Image
from scipy.spatial import cKDTree

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "public/advert"
W, H = 2048, 1024
DIMPLES = 392
STRENGTH = 4.2


def fibonacci_sphere(n):
    i = np.arange(n) + 0.5
    phi = np.arccos(1 - 2 * i / n)
    theta = np.pi * (1 + 5**0.5) * i
    return np.stack([np.cos(theta) * np.sin(phi), np.cos(phi), np.sin(theta) * np.sin(phi)], axis=1)


def main():
    centers = fibonacci_sphere(DIMPLES)
    tree = cKDTree(centers)
    spacing = np.sqrt(4 * np.pi / DIMPLES)
    radius = 0.47 * spacing

    # Texel centres -> points on the unit sphere (three.js SphereGeometry mapping:
    # u = longitude, v = latitude, y up).
    u = (np.arange(W) + 0.5) / W
    v = (np.arange(H) + 0.5) / H
    lon = u * 2 * np.pi
    lat = (0.5 - v) * np.pi
    LON, LAT = np.meshgrid(lon, lat)
    pts = np.stack(
        [-np.cos(LON) * np.cos(LAT), np.sin(LAT), np.sin(LON) * np.cos(LAT)], axis=-1
    ).reshape(-1, 3)
    chord, _ = tree.query(pts)
    ang = 2 * np.arcsin(np.clip(chord / 2, 0, 1)).reshape(H, W)

    # Spherical cup with a softened rim.
    x = np.clip(ang / radius, 0, 1)
    height = -(1 - x**2) * (x < 1)
    rim = np.clip((x - 0.86) / 0.14, 0, 1)
    height = height * (1 - rim**2 * (3 - 2 * rim))

    # Tangent-space normals from the height gradient (longitude scaled by latitude).
    dlon = 2 * np.pi / W
    dlat = np.pi / H
    coslat = np.maximum(np.cos(LAT), 0.08)
    gx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) / (2 * dlon * coslat)
    gy = (np.roll(height, 1, axis=0) - np.roll(height, -1, axis=0)) / (2 * dlat)
    gy[0, :] = gy[-1, :] = 0
    scale = STRENGTH * radius * 0.06
    n = np.stack([-gx * scale, -gy * scale, np.ones_like(gx)], axis=-1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    Image.fromarray(((n * 0.5 + 0.5) * 255).round().astype(np.uint8)).save(OUT / "ball-normal.png", optimize=True)

    # Colour: warm white with gentle cavity shading inside each dimple.
    cavity = np.clip(-height, 0, 1) ** 1.5
    base = np.array([243, 242, 236], dtype=np.float64)
    color = base[None, None, :] * (1 - 0.16 * cavity[..., None])
    Image.fromarray(color.round().astype(np.uint8)).save(OUT / "ball-color.png", optimize=True)
    print(f"wrote {OUT.relative_to(ROOT)}/ball-normal.png, ball-color.png ({DIMPLES} dimples)")


if __name__ == "__main__":
    main()
