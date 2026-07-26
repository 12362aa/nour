# -*- coding: utf-8 -*-
import json
with open('app.json', 'r', encoding='utf8') as f:
    data = json.load(f)
data['expo']['name'] = 'نُور - Nour'
with open('app.json', 'w', encoding='utf8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("Updated successfully")