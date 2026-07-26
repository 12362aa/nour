# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

old_section1 = '''      <SectionTitle title="نور على منصات أخرى" />
      <Card style={{ gap: spacing.md }}>
        <Pressable onPress={() => openLink("https://t.me/Islamic72_bot")} style={[styles.settingRow, { paddingVertical: spacing.md }]}>
          <Text style={[styles.settingValue, { color: colors.primary, fontWeight: "800" }]}>افتح البوت</Text>
          <View style={{ flex: 1, alignItems: "flex-end", marginRight: 8 }}>
            <Text style={[styles.settingLabel, { color: colors.ink }]}>بوت تليجرام (Islamic72_bot)</Text>
            <Text style={[styles.settingAbout, { color: colors.muted, textAlign: "right" }]}>نسخة مصغرة من التطبيق على تليجرام يمكنك استخدامها في أي وقت.</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => openLink("https://wa.me/201004886479")} style={[styles.settingRow, { paddingVertical: spacing.md }]}>
          <Text style={[styles.settingValue, { color: colors.primary, fontWeight: "800" }]}>افتح المحادثة</Text>
          <View style={{ flex: 1, alignItems: "flex-end", marginRight: 8 }}>
            <Text style={[styles.settingLabel, { color: colors.ink }]}>رقم المطور (201004886479+)</Text>
            <Text style={[styles.settingAbout, { color: colors.muted, textAlign: "right" }]}>رقم الدعم الفني للمطور (اضغط للمحادثة المباشرة).</Text>
          </View>
        </Pressable>
      </Card>

      <SectionTitle title="التواصل مع المطور" />
      <Card style={{ gap: spacing.md }}>
        <Pressable onPress={() => openLink("mailto:contact@new-idea.info")} style={[styles.settingRow, { paddingVertical: spacing.md }]}>
          <Text style={[styles.settingValue, { color: colors.primary, fontWeight: "800" }]}>إرسال بريد</Text>
          <View style={{ flex: 1, alignItems: "flex-end", marginRight: 8 }}>
            <Text style={[styles.settingLabel, { color: colors.ink }]}>الدعم الفني والاقتراحات</Text>
            <Text style={[styles.settingAbout, { color: colors.muted, textAlign: "right" }]}>تواصل مباشر مع مطور التطبيق للاقتراحات أو البلاغات.</Text>
          </View>
        </Pressable>
      </Card>'''

new_section1 = '''      <SectionTitle title="نور على منصات أخرى" />
      <Card style={{ gap: spacing.md }}>
        <Pressable onPress={() => openLink("https://t.me/Islamic72_bot")} style={[styles.settingRow, { paddingVertical: spacing.md }]}>
          <Text style={[styles.settingValue, { color: colors.primary, fontWeight: "800" }]}>افتح البوت</Text>
          <View style={{ flex: 1, alignItems: "flex-end", marginRight: 8 }}>
            <Text style={[styles.settingLabel, { color: colors.ink }]}>بوت تليجرام (Islamic72_bot)</Text>
            <Text style={[styles.settingAbout, { color: colors.muted, textAlign: "right" }]}>نسخة مصغرة من التطبيق على تليجرام يمكنك استخدامها في أي وقت.</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => openLink("https://wa.me/201004886479")} style={[styles.settingRow, { paddingVertical: spacing.md }]}>
          <Text style={[styles.settingValue, { color: colors.primary, fontWeight: "800" }]}>افتح البوت</Text>
          <View style={{ flex: 1, alignItems: "flex-end", marginRight: 8 }}>
            <Text style={[styles.settingLabel, { color: colors.ink }]}>بوت واتساب نور</Text>
            <Text style={[styles.settingAbout, { color: colors.muted, textAlign: "right" }]}>تفاعل مع نور مباشرة عبر الواتساب للخدمات الإسلامية.</Text>
          </View>
        </Pressable>
      </Card>

      <SectionTitle title="التواصل مع المطور" />
      <Card style={{ gap: spacing.md }}>
        <Pressable onPress={() => openLink("https://wa.me/201098612184")} style={[styles.settingRow, { paddingVertical: spacing.md }]}>
          <Text style={[styles.settingValue, { color: colors.primary, fontWeight: "800" }]}>محادثة واتساب</Text>
          <View style={{ flex: 1, alignItems: "flex-end", marginRight: 8 }}>
            <Text style={[styles.settingLabel, { color: colors.ink }]}>رقم المطور</Text>
            <Text style={[styles.settingAbout, { color: colors.muted, textAlign: "right" }]}>تواصل مباشر للمقترحات أو الدعم الفني.</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => openLink("mailto:ahmedkhalifaw3@gmail.com")} style={[styles.settingRow, { paddingVertical: spacing.md }]}>
          <Text style={[styles.settingValue, { color: colors.primary, fontWeight: "800" }]}>إرسال بريد</Text>
          <View style={{ flex: 1, alignItems: "flex-end", marginRight: 8 }}>
            <Text style={[styles.settingLabel, { color: colors.ink }]}>البريد الإلكتروني</Text>
            <Text style={[styles.settingAbout, { color: colors.muted, textAlign: "right" }]}>ahmedkhalifaw3@gmail.com</Text>
          </View>
        </Pressable>
      </Card>'''

code = code.replace(old_section1, new_section1)
with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Updated Developer Contact Information")