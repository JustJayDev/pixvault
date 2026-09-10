import random, os
from PIL import Image, ImageDraw, ImageFilter

OUT = "/root/pixvault/public/wallpapers"
TH = OUT + "/thumbs"
os.makedirs(TH, exist_ok=True)
random.seed(42)

def vgrad(w, h, stops):
    col = Image.new("RGB", (1, len(stops)))
    col.putdata([tuple(s) for s in stops])
    return col.resize((w, h), Image.BILINEAR)

def save(img, name, w, h):
    img.save(OUT + "/" + name, quality=88, optimize=True)
    tw = 640; th = round(h * tw / w)
    img.resize((tw, th), Image.LANCZOS).save(TH + "/" + name.replace(".jpg", ".webp"), "WEBP", quality=80)
    print("ok", name)

def blobs(img, n, rmin, rmax, cols, blur):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    w, h = img.size
    for _ in range(n):
        r = random.randint(rmin, rmax)
        x, y = random.randint(-r, w), random.randint(-r, h)
        d.ellipse([x - r, y - r, x + r, y + r], fill=random.choice(cols))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")

def stars(img, n, bright=200):
    d = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    for _ in range(n):
        x, y = random.randint(0, w - 1), random.randint(0, h - 1)
        s = random.choice([1, 1, 1, 2])
        a = random.randint(bright // 2, bright)
        d.ellipse([x, y, x + s, y + s], fill=(255, 255, 255, a))
    return img