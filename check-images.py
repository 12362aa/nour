import os
import glob
from PIL import Image

image_files = glob.glob(r'C:\Users\newmo\.gemini\antigravity\brain\161c2f72-43ce-41b2-b3e4-c116cc59c3bc\.user_uploaded\*')
for f in image_files:
    if f.lower().endswith(('.png', '.jpg', '.jpeg')):
        try:
            img = Image.open(f)
            print(f"File: {os.path.basename(f)}, Size: {img.size}")
        except Exception as e:
            print(f"Error reading {f}: {e}")