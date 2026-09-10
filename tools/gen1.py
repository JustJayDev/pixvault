import sys
sys.path.insert(0, "/root/pixvault/tools")
from genlib import *

# 1 neon-city-rain 1440x3120
w, h = 1440, 3120
img = vgrad(w, h, [(8, 6, 20), (30, 12, 52), (12, 16, 38), (5, 5, 12)])
d = ImageDraw.Draw(img, "RGBA")
for i in range(14):
    bw = random.randint(90, 220); bx = random.randint(-40, w - 100); bh = random.randint(600, 1600)
    d.rectangle([bx, h - bh, bx + bw, h], fill=(10, 8, 24, 255))
    for _ in range(random.randint(8, 26)):
        wx = bx + random.randint(8, max(9, bw - 24)); wy = h - bh + random.randint(20, bh - 40)
        col = random.choice([(255, 0, 170), (0, 229, 255), (255, 200, 60)])
        d.rectangle([wx, wy, wx + 10, wy + 16], fill=col + (230,))
img = blobs(img, 5, 200, 420, [(120, 20, 160, 90), (0, 90, 140, 80)], 150)
d = ImageDraw.Draw(img, "RGBA")
for _ in range(260):
    x, y = random.randint(0, w), random.randint(0, h)
    d.line([x, y, x - 6, y + random.randint(18, 60)], fill=(200, 220, 255, 60))
save(img, "neon-city-rain.jpg", w, h)

# 2 violet-nebula 1440x3200
w, h = 1440, 3200
img = vgrad(w, h, [(4, 4, 10), (10, 6, 24), (6, 6, 14)])
img = blobs(img, 9, 150, 380, [(124, 58, 237, 110), (88, 28, 135, 90), (34, 211, 238, 60), (190, 24, 93, 70)], 120)
img = stars(img, 900)
d = ImageDraw.Draw(img, "RGBA")
cx, cy = int(w * 0.5), int(h * 0.38)
for rr in range(60, 340, 14):
    a = max(0, 150 - rr // 3)
    d.ellipse([cx - rr * 2, cy - rr // 2, cx + rr * 2, cy + rr // 2], outline=(180, 140, 255, a), width=2)
save(img, "violet-nebula.jpg", w, h)

# 3 midnight-peaks 1080x2400
w, h = 1080, 2400
img = vgrad(w, h, [(10, 14, 26), (24, 30, 52), (40, 48, 76), (14, 18, 32)])
d = ImageDraw.Draw(img, "RGBA")
for li, (base, col) in enumerate([(1500, (30, 38, 62)), (1750, (22, 28, 48)), (2000, (14, 18, 34))]):
    pts = [(0, h)]
    x = 0
    while x < w:
        pts.append((x, base + random.randint(-160, 160))); x += random.randint(120, 260)
    pts.append((w, h))
    d.polygon(pts, fill=col + (255,))
d.polygon([(0, h), (0, 2050), (w, 2250), (w, h)], fill=(8, 10, 20, 255))
d.ellipse([w * 0.62, 320, w * 0.62 + 130, 450], fill=(230, 230, 245, 235))
img = img.filter(ImageFilter.GaussianBlur(0.6))
save(img, "midnight-peaks.jpg", w, h)