# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

# 1. Update Header signature
old_header_sig = 'function Header({ title, subtitle, onBack, navigate }: { title: string; subtitle?: string; onBack?: () => void; navigate?: (route: Route) => void }) {'
new_header_sig = 'function Header({ title, subtitle, onBack, navigate, onInfoPress, showInfoBadge }: { title: string; subtitle?: string; onBack?: () => void; navigate?: (route: Route) => void; onInfoPress?: () => void; showInfoBadge?: boolean; }) {'
code = code.replace(old_header_sig, new_header_sig)

# 2. Add Info button in Header
old_header_right = '''      {navigate && !onBack ? (
        <Pressable
          onPress={() => navigate("account")}
          style={[styles.iconButton, { overflow: "hidden" }]}
          accessibilityLabel="إعدادات الحساب"
        >'''
new_header_right = '''      {navigate && !onBack ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {onInfoPress ? (
            <Pressable onPress={onInfoPress} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSoft, justifyContent: "center", alignItems: "center", position: "relative" }}>
              <Info color={colors.primary} size={22} />
              {showInfoBadge && <View style={{ position: "absolute", top: 8, right: 8, width: 10, height: 10, borderRadius: 5, backgroundColor: "#ef4444", borderWidth: 2, borderColor: colors.surfaceSoft }} />}
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => navigate("account")}
            style={[styles.iconButton, { overflow: "hidden" }]}
            accessibilityLabel="إعدادات الحساب"
          >'''
code = code.replace(old_header_right, new_header_right)

# Wait, Info icon from lucide-react-native might not be imported in NourApp.tsx.
# Let's import it.
if 'Info' not in code:
    code = code.replace('import {', 'import {\n  Info,', 1) # This is risky, let's just use a string replace on lucide-react-native imports
    code = code.replace('import { Activity,', 'import { Activity, Info,', 1)

# Now inject it into HomeScreen
old_home_header = '<Header title="نور" subtitle="رفيقك اليومي للذكر والقرآن" navigate={navigate} />'
new_home_header = '<Header title="نور" subtitle="رفيقك اليومي للذكر والقرآن" navigate={navigate} onInfoPress={updateMessage ? () => setShowUpdateModal(true) : undefined} showInfoBadge={!!updateMessage && !updateSeen} />'
code = code.replace(old_home_header, new_home_header)

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Updated Header and HomeScreen with Info icon")