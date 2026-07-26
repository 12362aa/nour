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

with open('recent_inputs.txt', 'w', encoding='utf8') as out:
    for i, l in enumerate(lines[-10:]):
        out.write(f"--- USER INPUT {i} ---\n")
        out.write(l + "\n\n")