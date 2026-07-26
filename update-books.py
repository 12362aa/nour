# -*- coding: utf-8 -*-
import re
with open('src/features/RestoredFeatures.tsx', 'r', encoding='utf8') as f:
    code = f.read()

# Add import if missing
if 'import * as WebBrowser' not in code:
    code = code.replace('import { WebView } from "react-native-webview";', 'import { WebView } from "react-native-webview";\nimport * as WebBrowser from "expo-web-browser";')

# Replace BookLibraryScreen
new_screen = '''export function BookLibraryScreen({ onBack, showError, showToast }: CommonProps) {
  const { colors } = useNourTheme();
  const [progress, setProgress] = useState<Record<string, number>>({});
  const { playBook, currentBook, isPlaying } = useAudioStore();

  const downloadLocalBook = async (book: LibraryBook) => {
    try {
      if (book.downloadUrl) {
        setProgress((current) => ({ ...current, [book.id]: 0.01 }));
        await downloadBook(book, (value) => setProgress((current) => ({ ...current, [book.id]: value })));
        if (showToast) showToast("تم تحميل الكتاب بنجاح ويمكنك تصفحه.");
      }
    } catch (error) {
      showError(error, () => void downloadLocalBook(book));
    } finally {
      setProgress((current) => ({ ...current, [book.id]: 0 }));
    }
  };

  const openBook = async (book: LibraryBook) => {
    const bookUrl = book.downloadUrl || book.url;
    await WebBrowser.openBrowserAsync(bookUrl, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN });
  };

  return (
    <FeatureScreen>
      <FeatureHeader title="مكتبة نور" subtitle="كتب إسلامية مختارة للقراءة والحفظ" onBack={onBack} />
      <Image source={require("../../assets/library-hero.png")} style={styles.libraryHero} />
      {LIBRARY_BOOKS.map((book) => {
        const downloading = Boolean(progress[book.id]);
        return (
          <Pressable key={book.id} onPress={() => void openBook(book)}>
            <FeatureCard style={styles.bookRow}>
              {book.cover.startsWith("http") ? (
                <Image source={{ uri: book.cover }} style={[styles.bookCover, { backgroundColor: colors.surfaceSoft }]} resizeMode="cover" />
              ) : (
                <View style={[styles.bookCover, { backgroundColor: colors.primary }]}><Text style={styles.bookCoverText}>{book.cover}</Text></View>
              )}
              <View style={styles.grow}>
                <Text style={[styles.cardTitle, { color: colors.ink }]}>{book.title}</Text>
                <Text style={[styles.meta, { color: colors.gold }]}>{book.author} · {book.category}</Text>
                <Text style={[styles.smallBody, { color: colors.muted }]}>{book.description}</Text>
                {downloading ? <Text style={[styles.progress, { color: colors.primary }]}>جاري التحميل... {Math.round(progress[book.id] * 100)}%</Text> : null}
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable onPress={() => void openBook(book)} style={[{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.primary, height: 42, paddingHorizontal: 16, borderRadius: 21 }]}>
                  <BookOpen color="#FFFFFF" size={18} />
                  <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800" }}>قراءة</Text>
                </Pressable>
                {book.downloadUrl ? (
                  <Pressable disabled={downloading} onPress={() => void downloadLocalBook(book)} style={[styles.roundAction, { backgroundColor: colors.surfaceSoft }]}>
                    <Download color={colors.primary} size={21} />
                  </Pressable>
                ) : (
                  <Pressable onPress={() => void openBook(book)} style={[styles.roundAction, { backgroundColor: colors.surfaceSoft }]}>
                    <ExternalLink color={colors.primary} size={21} />
                  </Pressable>
                )}
                {book.audioUrl ? (
                  <Pressable onPress={() => playBook(book)} style={[styles.roundAction, { backgroundColor: currentBook?.id === book.id && isPlaying ? colors.gold : colors.surfaceSoft }]}>
                    <Headphones color={currentBook?.id === book.id && isPlaying ? "#FFFFFF" : colors.primary} size={21} />
                  </Pressable>
                ) : null}
              </View>
            </FeatureCard>
          </Pressable>
        );
      })}
      <View style={{ height: 40 }} />
    </FeatureScreen>
  );
}'''

# use Regex to replace the function definition completely
pattern = re.compile(r'export function BookLibraryScreen\(\{ onBack, showError, showToast \}: CommonProps\) \{.*?(?=export function HadithBooksScreen)', re.DOTALL)
code = pattern.sub(new_screen + '\n\n', code)

with open('src/features/RestoredFeatures.tsx', 'w', encoding='utf8') as f:
    f.write(code)

print("Updated BookLibraryScreen successfully")