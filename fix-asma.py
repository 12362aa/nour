# -*- coding: utf-8 -*-
import re

with open('src/data/asma-ul-husna.ts', 'r', encoding='utf8') as f:
    code = f.read()

# Update interface
code = code.replace(
'''export type ArabicAllahName = {
  number: number;
  name: string;
  meaning: string;
  reflection: string;
  imageUrl: string;
};''',
'''export type ArabicAllahName = {
  number: number;
  name: string;
  meaning: string;
  evidence: string;
  benefit: string;
  imageUrl: string;
};''')

# Replace reflection with benefit and add empty evidence
code = re.sub(r'reflection: "(.*?)",', r'evidence: "يُضاف لاحقاً من المصادر الشرعية",\n    benefit: "\1",', code)

with open('src/data/asma-ul-husna.ts', 'w', encoding='utf8') as f:
    f.write(code)
print("Updated Asma Ul Husna interface")