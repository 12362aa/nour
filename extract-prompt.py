# -*- coding: utf-8 -*-
import json

path = r'C:\Users\newmo\.gemini\antigravity\brain\161c2f72-43ce-41b2-b3e4-c116cc59c3bc\.system_generated\logs\transcript_full.jsonl'

with open(path, 'r', encoding='utf8') as f:
    for line in f:
        try:
            obj = json.loads(line)
            if obj.get('type') == 'USER_INPUT' and 'بروموت شامل' in obj.get('content', ''):
                print(obj['content'])
                break
        except Exception:
            pass