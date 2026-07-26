# -*- coding: utf-8 -*-
import os
import json

target_dir = 'd:\\nour app'
for root, dirs, files in os.walk(target_dir):
    if 'node_modules' in dirs: dirs.remove('node_modules')
    if '.git' in dirs: dirs.remove('.git')
    for file in files:
        if file.endswith('.json'):
            path = os.path.join(root, file)
            # check if it contains Asmaul Husna data
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if 'الرحمن' in content or 'allah' in content.lower() or 'asma' in content.lower() or 'names' in content.lower():
                        print(path)
            except:
                pass