# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    lines = f.readlines()

start_detail = -1
end_screen = -1

for i, line in enumerate(lines):
    if line.startswith("function NameDetail("):
        start_detail = i
    if line.startswith("function AccountScreen("):
        end_screen = i
        break
    if line.startswith("function AboutScreen("):
        end_screen = i
        break
    if start_detail != -1 and line.startswith("function SettingsScreen("):
        end_screen = i
        break

if start_detail != -1 and end_screen != -1:
    print(f"Lines: {start_detail + 1} to {end_screen}")
else:
    print("Could not find boundaries", start_detail, end_screen)