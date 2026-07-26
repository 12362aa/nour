# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

# Replace the Hadith section with Evidence if available
old_hadith = '''<Card>
        <Text style={[styles.detailLabel, { color: colors.gold }]}>حديث نبوي شريف</Text>
        <Text style={[styles.detailText, { color: colors.ink, lineHeight: 24 }]}>«إنّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا مِائَةً إلَّا واحِدًا، مَنْ أحْصَاهَا دَخَلَ الجَنَّةَ» — متفق عليه.</Text>
      </Card>'''
      
new_evidence = '''{item.evidence ? (
        <Card>
          <Text style={[styles.detailLabel, { color: colors.gold }]}>الدليل من القرآن والسنة</Text>
          <Text style={[styles.detailText, { color: colors.ink, lineHeight: 26 }]}>{item.evidence}</Text>
        </Card>
      ) : (
        <Card>
          <Text style={[styles.detailLabel, { color: colors.gold }]}>حديث نبوي شريف</Text>
          <Text style={[styles.detailText, { color: colors.ink, lineHeight: 24 }]}>«إنّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا مِائَةً إلَّا واحِدًا، مَنْ أحْصَاهَا دَخَلَ الجَنَّةَ» — متفق عليه.</Text>
        </Card>
      )}'''

code = code.replace(old_hadith, new_evidence)

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Updated NameDetail to show evidence")