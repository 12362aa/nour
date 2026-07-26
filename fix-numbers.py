import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf8') as f:
        content = f.read()
    
    # Replace number formatting
    new_content = content.replace('.toLocaleString("ar-EG")', '.toLocaleString("en-US")')
    
    # Also replace in formatPrayerTime in time.ts
    if 'time.ts' in filepath:
        new_content = new_content.replace("hour: 'numeric', minute: 'numeric', hour12: true", "hour: 'numeric', minute: 'numeric', hour12: true")
        # Wait, formatPrayerTime uses toLocaleTimeString('ar-EG'). We need the AM/PM in Arabic!
        # If we use 'en-US', it will say "AM/PM". We want 12-hour but with 'ص/م'.
        # Let's check time.ts specifically.

    if new_content != content:
        with open(filepath, 'w', encoding='utf8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            replace_in_file(os.path.join(root, file))