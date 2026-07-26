# -*- coding: utf-8 -*-
with open('src/features/RestoredFeatures.tsx', 'r', encoding='utf8') as f:
    code = f.read()

# 1. Fix the viewerUrl
old_viewer = 'const viewerUrl = "https://docs.google.com/gview?embedded=true&url=";'
new_viewer = 'const bookUrl = readingBook.downloadUrl || readingBook.url;\n    const viewerUrl = "https://docs.google.com/gview?embedded=true&url=" + encodeURIComponent(bookUrl);'
code = code.replace(old_viewer, new_viewer)

# 2. Add 'قراءة' explicit button instead of the vague BookOpen icon.
# The vague icon:
# <Pressable onPress={() => void openBook(book)} style={[styles.roundAction, { backgroundColor: colors.primary }]}>
#   <BookOpen color="#FFFFFF" size={21} />
# </Pressable>

old_button = '''<Pressable onPress={() => void openBook(book)} style={[styles.roundAction, { backgroundColor: colors.primary }]}>
                  <BookOpen color="#FFFFFF" size={21} />
                </Pressable>'''
new_button = '''<Pressable onPress={() => void openBook(book)} style={[{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.primary, height: 42, paddingHorizontal: 16, borderRadius: 21 }]}>
                  <BookOpen color="#FFFFFF" size={18} />
                  <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800" }}>قراءة</Text>
                </Pressable>'''
code = code.replace(old_button, new_button)

with open('src/features/RestoredFeatures.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Fixed BookLibraryScreen viewer and added Read button")