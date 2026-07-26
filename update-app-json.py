# -*- coding: utf-8 -*-
import json

with open('app.json', 'r', encoding='utf8') as f:
    data = json.load(f)

expo = data.get('expo', data)

expo['name'] = 'Nour'
if 'displayName' not in expo:
    expo['name'] = 'نُور - Nour' # fallback if displayName isn't supported, but we will add it just in case
# Actually expo name doesn't support arabic well for CLI sometimes, but it's fine.

expo['icon'] = './assets/icon.jpg'

if 'splash' in expo:
    expo['splash']['image'] = './assets/icon.jpg'
    expo['splash']['resizeMode'] = 'contain'
    expo['splash']['backgroundColor'] = '#F8F9FA'
    
    # Enable dark mode splash
    expo['splash']['dark'] = {
        "image": "./assets/icon.jpg",
        "backgroundColor": "#0F172A"
    }

if 'android' in expo:
    expo['android']['adaptiveIcon'] = {
        "foregroundImage": "./assets/icon.jpg",
        "backgroundColor": "#F8F9FA"
    }

with open('app.json', 'w', encoding='utf8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Updated app.json with new logo and name")