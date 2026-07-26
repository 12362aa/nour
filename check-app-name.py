# -*- coding: utf-8 -*-
import json
with open('app.json', 'r', encoding='utf8') as f:
    data = json.load(f)
print(data['expo']['name'])