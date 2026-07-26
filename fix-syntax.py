# -*- coding: utf-8 -*-

with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

code = code.replace('AsyncStorage.getItem(@update_message_seen_)', 'AsyncStorage.getItem("@update_message_seen_" + version)')
code = code.replace('AsyncStorage.getItem(@update_message_seen_)', 'AsyncStorage.getItem("@update_message_seen_" + version)')
code = code.replace('AsyncStorage.getItem(@update_message_seen_)', 'AsyncStorage.getItem("@update_message_seen_" + version)')
code = code.replace('AsyncStorage.setItem(@update_message_seen_, "true")', 'AsyncStorage.setItem("@update_message_seen_" + version, "true")')

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Fixed syntax errors in NourApp.tsx")