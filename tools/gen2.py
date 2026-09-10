import sys, math
sys.path.insert(0, "/root/pixvault/tools")
from genlib import *

# 4 samurai-dusk 1440x3040
w, h = 1440, 3040
img = vgrad(w, h, [(252, 116, 68), (236, 72, 90), (120, 40, 96), (30, 20, 48)])
d = ImageDraw.Draw(img, "RGBA")
d.ellipse([w * 0.18, h * 0.30, w * 0.18 + 380, h * 0.30 + 380], fill=(255, 214, 140, 255))
img = img.filter(ImageFilter.GaussianBlur(1.2))
d = ImageDraw.Draw(img, "RGBA")
for li, (base, col) in enumerate([(1750, (60, 30, 60, 200)), (2000, (40, 24, 46, 230)), (2250, (20, 14, 30, 255))]):
    pts = [(0, h)]; x = 0
    while x < w:
        pts.append((x, base + random.randint(-140, 140))); x += random.randint(140, 300)
    pts.append((w, h))
    d.polygon(pts, fill=col)
cx = w // 2
d.rectangle([cx - 5, 1450, cx + 5, 2500], fill=(12, 10, 18, 255))
d.polygon([(cx - 5, 1450), (cx + 5, 1450), (cx, 1380)], fill=(12, 10, 18, 255))
d.line([cx - 90, 1500, cx + 90, 1470], fill=(12, 10, 18, 255), width=8)
save(img, "samurai-dusk.jpg", w, h)

# 5 liquid-violet 1080x2340
w, h = 1080, 2340
img = vgrad(w, h, [(30, 16, 60), (76, 29, 150), (147, 51, 234), (56, 189, 248)])
img = blobs(img, 12, 120, 340, [(255, 255, 255, 26), (30, 10, 60, 60), (216, 180, 254, 40)], 90)
d = ImageDraw.Draw(img, "RGBA")
for _ in range(7):
    x0, y0 = random.randint(0, w), random.randint(0, h)
    pts = [(x0 + i * 40, y0 + int(60 * math.sin(i / 2))) for i in range(20)]
    d.line(pts, fill=(255, 255, 255, 30), width=random.randint(2, 5))
save(img, "liquid-violet.jpg", w, h)

# 6 cyber-grid 1080x2400
w, h = 1080, 2400
img = vgrad(w, h, [(10, 4, 26), (40, 8, 60), (12, 6, 30)])
d = ImageDraw.Draw(img, "RGBA")
hz = int(h * 0.62)
for i in range(26):
    y = hz + int((i ** 1.7) * 9)
    if y > h: break
    a = max(30, 200 - i * 7)
    d.line([0, y, w, y], fill=(34, 211, 238, a), width=2)
for i in range(-14, 15):
    x_top = w // 2 + i * 26
    x_bot = w // 2 + i * 150
    d.line([x_top, hz, x_bot, h], fill=(168, 85, 247, 160), width=2)
d.ellipse([w // 2 - 190, hz - 60, w // 2 + 190, hz + 60], fill=(255, 60, 180, 70))
img = img.filter(ImageFilter.GaussianBlur(0.8))
save(img, "cyber-grid.jpg", w, h)
print("ALL DONE")