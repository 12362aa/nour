import re

with open('src/features/RestoredFeatures.tsx', 'r', encoding='utf8') as f:
    code = f.read()

book_library_code = """
export function BookLibraryScreen({ onBack, showError, showToast }: CommonProps) {
  const { colors } = useNourTheme();
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [readingBook, setReadingBook] = useState<LibraryBook | null>(null);
  const { playBook, currentBook, isPlaying } = useAudioStore();

  const downloadLocalBook = async (book: LibraryBook) => {
    try {
      if (book.downloadUrl) {
        setProgress((current) => ({ ...current, [book.id]: 0.01 }));
        await downloadBook(book, (value) => setProgress((current) => ({ ...current, [book.id]: value })));
        if (showToast) showToast("أصبح الكتاب محفوظاً على جهازك.");
      }
    } catch (error) {
      showError(error, () => void downloadLocalBook(book));
    } finally {
      setProgress((current) => ({ ...current, [book.id]: 0 }));
    }
  };

  const openBook = async (book: LibraryBook) => {
    if (book.downloadUrl) {
      setReadingBook(book);
    } else {
      await Linking.openURL(book.url);
    }
  };

  if (readingBook) {
    const viewerUrl = https://docs.google.com/gview?embedded=true&url=;
    return (
      <FeatureScreen noScroll>
        <FeatureHeader title={readingBook.title} subtitle="القارئ المدمج" onBack={() => setReadingBook(null)} />
        <View style={{ flex: 1, backgroundColor: colors.surface }}>
          <WebView 
            source={{ uri: viewerUrl }} 
            style={{ flex: 1, backgroundColor: "transparent" }} 
            startInLoadingState={true}
            renderLoading={() => <ActivityIndicator color={colors.gold} size="large" style={{ position: "absolute", top: "50%", left: "50%", marginLeft: -18, marginTop: -18 }} />}
          />
        </View>
      </FeatureScreen>
    );
  }

  return (
    <FeatureScreen>
      <FeatureHeader title="مكتبة نور" subtitle="كتب إسلامية للقراءة والحفظ على الجهاز" onBack={onBack} />
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
                {downloading ? <Text style={[styles.progress, { color: colors.primary }]}>جارٍ الحفظ… {Math.round(progress[book.id] * 100)}%</Text> : null}
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable onPress={() => void openBook(book)} style={[styles.roundAction, { backgroundColor: colors.primary }]}>
                  <BookOpen color="#FFFFFF" size={21} />
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
    </FeatureScreen>
  );
}
"""

marker = '</FeatureScreen>\n  );\n}'
p = code.find('export function QiblaScreen')

if p != -1:
    p2 = code.find(marker, p)
    if p2 != -1:
        new_code = code[:p2 + len(marker)] + '\n\n' + book_library_code + code[p2 + len(marker):]
        with open('src/features/RestoredFeatures.tsx', 'w', encoding='utf8') as f:
            f.write(new_code)
        print("Restored BookLibraryScreen successfully")