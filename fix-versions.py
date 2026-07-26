import json

for file in ['app.json', 'package.json']:
    with open(file, 'r', encoding='utf8') as f:
        data = json.load(f)
    
    if 'expo' in data:
        data['expo']['version'] = '1.5.1'
    else:
        data['version'] = '1.5.1'
        
    with open(file, 'w', encoding='utf8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
print("Updated version bump to 1.5.1")