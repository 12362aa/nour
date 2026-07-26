# -*- coding: utf-8 -*-
import re

with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

new_names_screen = '''
function NameDetail({ item, all, onSelect, onBack }: { item: AllahName; all: AllahName[]; onSelect: (i: AllahName) => void; onBack: () => void }) {
  const { colors } = useNourTheme();
  const currentIndex = all.findIndex((a) => a.number === item.number);
  const next = all[currentIndex + 1];
  const prev = all[currentIndex - 1];

  return (
    <Screen>
      <Header title="أسماء الله الحسنى" onBack={onBack} />
      <View style={{ padding: 24, alignItems: "center", gap: 16 }}>
        <ImageBackground source={{ uri: item.imageUrl }} style={{ width: 160, height: 160, justifyContent: "center", alignItems: "center", borderRadius: 80, overflow: "hidden" }} imageStyle={{ opacity: 0.2 }}>
          <NativeText style={{ fontSize: 42, fontWeight: "900", color: colors.gold }}>{item.name}</NativeText>
        </ImageBackground>
        
        <Card style={{ width: "100%", padding: 24, gap: 16 }}>
          <View>
            <NativeText style={{ fontSize: 18, color: colors.primary, fontWeight: "800", marginBottom: 8, textAlign: "right" }}>المعنى</NativeText>
            <NativeText style={{ fontSize: 16, color: colors.ink, lineHeight: 26, textAlign: "right" }}>{item.meaning}</NativeText>
          </View>
          
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
          
          <View>
            <NativeText style={{ fontSize: 18, color: colors.primary, fontWeight: "800", marginBottom: 8, textAlign: "right" }}>الدليل من القرآن أو السنة</NativeText>
            <NativeText style={{ fontSize: 16, color: colors.ink, lineHeight: 26, textAlign: "right" }}>{item.evidence}</NativeText>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
          
          <View>
            <NativeText style={{ fontSize: 18, color: colors.primary, fontWeight: "800", marginBottom: 8, textAlign: "right" }}>ثمرة الإيمان بالاسم</NativeText>
            <NativeText style={{ fontSize: 16, color: colors.ink, lineHeight: 26, textAlign: "right" }}>{item.benefit}</NativeText>
          </View>
        </Card>

        <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 16 }}>
          <PrimaryButton label="السابق" secondary onPress={() => prev && onSelect(prev)} disabled={!prev} icon={ChevronRight} />
          <PrimaryButton label="التالي" secondary onPress={() => next && onSelect(next)} disabled={!next} icon={ChevronLeft} />
        </View>
      </View>
    </Screen>
  );
}

function NamesScreen({ onBack, showError }: { onBack: () => void; showError: (error: unknown, retry: () => void) => void }) {
  const { colors } = useNourTheme();
  const { resource, reload } = useResource(getAllahNames, []);
  const [selected, setSelected] = useState<AllahName | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "favorites">("all");
  
  const favoriteNames = useNourStore((state) => state.favoriteNames);
  const toggleFavoriteName = useNourStore((state) => state.toggleFavoriteName);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (selected) return <NameDetail item={selected} all={resource.data ?? []} onSelect={setSelected} onBack={() => setSelected(null)} />;
  
  let displayed = resource.data ?? [];
  if (filterMode === "favorites") {
    displayed = displayed.filter(item => favoriteNames.includes(item.number));
  }
  if (searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase();
    displayed = displayed.filter(item => item.name.includes(q) || item.meaning.includes(q));
  }

  return (
    <Screen>
      <Header title="أسماء الله الحسنى" subtitle="تعرف على الله بأسمائه وصفاته" onBack={onBack} />
      
      <View style={{ paddingHorizontal: 24, paddingBottom: 16, gap: 16 }}>
        {/* Search */}
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceSoft, borderRadius: 12, paddingHorizontal: 12, height: 48 }}>
          <Search color={colors.muted} size={20} />
          <TextInput 
            placeholder="ابحث بالاسم أو المعنى..." 
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ flex: 1, textAlign: "right", fontSize: 16, color: colors.ink, paddingHorizontal: 12, height: "100%" }}
          />
        </View>
        
        {/* Filter Segment */}
        <View style={{ flexDirection: "row", backgroundColor: colors.surfaceSoft, borderRadius: 12, padding: 4 }}>
          <Pressable onPress={() => setFilterMode("all")} style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, backgroundColor: filterMode === "all" ? colors.surface : "transparent" }}>
            <NativeText style={{ color: filterMode === "all" ? colors.ink : colors.muted, fontWeight: filterMode === "all" ? "800" : "600", fontSize: 14 }}>الكل</NativeText>
          </Pressable>
          <Pressable onPress={() => setFilterMode("favorites")} style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, backgroundColor: filterMode === "favorites" ? colors.surface : "transparent" }}>
            <NativeText style={{ color: filterMode === "favorites" ? colors.ink : colors.muted, fontWeight: filterMode === "favorites" ? "800" : "600", fontSize: 14 }}>المفضلة</NativeText>
          </Pressable>
        </View>
      </View>

      {resource.phase === "loading" ? <LoadingState lines={6} /> : null}
      {resource.phase === "error" ? <ErrorState error={resource.error} onRetry={reload} onDetails={() => showError(resource.error, reload)} /> : null}
      
      {resource.data?.length ? (
        <View style={{ paddingHorizontal: 24, paddingBottom: 40, gap: 12 }}>
          {displayed.length > 0 ? displayed.map((item, index) => {
            const isExpanded = expandedId === item.number;
            const isFav = favoriteNames.includes(item.number);
            return (
              <Animated.View key={item.number} entering={FadeInDown.delay(Math.min(index * 20, 400)).springify()}>
                <Pressable
                  onPress={() => setExpandedId(isExpanded ? null : item.number)}
                  style={[styles.nameCard, { width: "100%", backgroundColor: colors.surface, borderColor: isExpanded ? colors.primary : colors.border, borderWidth: 1, overflow: "hidden", flexDirection: "column", alignItems: "stretch", padding: 0 }]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
                    <Pressable onPress={() => toggleFavoriteName(item.number)} style={{ padding: 8 }}>
                      <Heart color={isFav ? "#ef4444" : colors.muted} fill={isFav ? "#ef4444" : "transparent"} size={22} />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      <NativeText style={{ fontSize: 24, fontWeight: "900", color: colors.gold, textAlign: "right" }}>{item.name}</NativeText>
                    </View>
                    <View style={{ width: 32, alignItems: "center" }}>
                      {isExpanded ? <ChevronUp color={colors.muted} size={20} /> : <ChevronDown color={colors.muted} size={20} />}
                    </View>
                  </View>
                  
                  {isExpanded && (
                    <Animated.View entering={FadeIn.duration(200)} style={{ padding: 16, paddingTop: 0, gap: 12, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 }}>
                      <NativeText style={{ fontSize: 15, color: colors.ink, textAlign: "right", lineHeight: 24, marginTop: 12 }}>{item.meaning}</NativeText>
                      <Pressable onPress={() => setSelected(item)} style={{ backgroundColor: colors.surfaceSoft, paddingVertical: 10, borderRadius: 8, alignItems: "center", marginTop: 8 }}>
                        <NativeText style={{ color: colors.primary, fontWeight: "800", fontSize: 14 }}>التفاصيل والدليل</NativeText>
                      </Pressable>
                    </Animated.View>
                  )}
                </Pressable>
              </Animated.View>
            );
          }) : (
            <NativeText style={{ color: colors.muted, textAlign: "center", marginTop: 40, fontSize: 16 }}>لا توجد أسماء مطابقة لبحثك</NativeText>
          )}
        </View>
      ) : null}
    </Screen>
  );
}
'''

# We need to import Heart, Search, ChevronDown, ChevronUp if they aren't imported.
imports_to_add = []
for icon in ["Heart", "Search", "ChevronDown", "ChevronUp"]:
    if f"{icon}," not in code and f"{icon} " not in code:
        imports_to_add.append(icon)

if imports_to_add:
    code = re.sub(r'import\s*\{([^}]*)Activity', r'import {\1' + ", ".join(imports_to_add) + ', Activity', code)

# Replace the components
code = re.sub(r'function NameDetail.*?</Screen>\s*\);\s*\}', '', code, flags=re.DOTALL)
code = re.sub(r'function NamesScreen.*?</Screen>\s*\);\s*\}', new_names_screen, code, flags=re.DOTALL)

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Updated NamesScreen with Accordion, Favorites, Search, and Filters")