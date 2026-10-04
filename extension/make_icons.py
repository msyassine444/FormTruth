from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs(r"C:\FormTruth\extension\icons", exist_ok=True)

sizes = [16, 48, 128]
for size in sizes:
    img = Image.new("RGBA", (size, size), (79, 70, 229, 255))
    draw = ImageDraw.Draw(img)
    # ارسم حرف F
    try:
        font = ImageFont.truetype("arial.ttf", int(size * 0.7))
    except:
        font = ImageFont.load_default()
    text = "F"
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    draw.text(((size - w) / 2, (size - h) / 2 - bbox[1]), text, fill="white", font=font)
    img.save(fr"C:\FormTruth\extension\icons\icon{size}.png")

print("Icons created")