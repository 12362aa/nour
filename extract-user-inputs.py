# -*- coding: utf-8 -*-
import json

path = r'C:\Users\newmo\.gemini\antigravity\brain\161c2f72-43ce-41b2-b3e4-c116cc59c3bc\.system_generated\logs\transcript_full.jsonl'
lines = []
with open(path, 'r', encoding='utf8') as f:
    for line in f:
        try:
            obj = json.loads(line)
            if obj.get('type') == 'USER_INPUT':
                lines.append(obj.get('content', ''))
        except Exception:
            pass

# Print the last 10 user inputs
for i, l in enumerate(lines[-10:]):
    print(f"--- USER INPUT {i} ---")
    print(l[:1000]) # truncated to 1000 chars just in case