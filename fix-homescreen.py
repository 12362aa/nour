# -*- coding: utf-8 -*-
import re

with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

# 1. Add state to HomeScreen
state_to_add = """
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [updateSeen, setUpdateSeen] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    const checkUpdate = async () => {
      const version = Constants.expoConfig?.version ?? "1.5.1";
      const seen = await AsyncStorage.getItem(@update_message_seen_);
      if (seen) setUpdateSeen(true);
      
      const { data, error } = await supabase
        .from("app_update_message")
        .select("message")
        .eq("active", true)
        .eq("version", version)
        .maybeSingle();
      
      if (data?.message) {
        setUpdateMessage(data.message);
      }
    };
    void checkUpdate();
  }, []);
"""

code = code.replace('const [clock, setClock] = useState(() => new Date());', state_to_add + '\n    const [clock, setClock] = useState(() => new Date());')

# 2. Add Gift icon to Header
header_search = """<View style={styles.headerActionWrap}>
          <Pressable onPress={() => navigate("settings")} style={[styles.iconButton, { backgroundColor: colors.surface }]} accessibilityLabel="الإعدادات">
            <Settings color={colors.primary} size={22} />
          </Pressable>
        </View>"""
header_replace = """<View style={styles.headerActionWrap}>
          {updateMessage && !updateSeen ? (
            <Pressable onPress={() => setShowUpdateModal(true)} style={[styles.iconButton, { backgroundColor: colors.surfaceSoft, marginRight: 8 }]} accessibilityLabel="تحديث">
              <Gift color={colors.gold} size={22} />
            </Pressable>
          ) : null}
          <Pressable onPress={() => navigate("settings")} style={[styles.iconButton, { backgroundColor: colors.surface }]} accessibilityLabel="الإعدادات">
            <Settings color={colors.primary} size={22} />
          </Pressable>
        </View>"""
if header_search in code:
    code = code.replace(header_search, header_replace)
else:
    # try another format
    header_search_2 = """<Pressable onPress={() => navigate("settings")} style={[styles.iconButton, { backgroundColor: colors.surface }]} accessibilityLabel="الإعدادات">
            <Settings color={colors.primary} size={22} />
          </Pressable>
        </View>"""
    header_replace_2 = """{updateMessage && !updateSeen ? (
            <Pressable onPress={() => setShowUpdateModal(true)} style={[styles.iconButton, { backgroundColor: colors.surfaceSoft, marginRight: 8 }]} accessibilityLabel="تحديث">
              <Gift color={colors.gold} size={22} />
            </Pressable>
          ) : null}
          <Pressable onPress={() => navigate("settings")} style={[styles.iconButton, { backgroundColor: colors.surface }]} accessibilityLabel="الإعدادات">
            <Settings color={colors.primary} size={22} />
          </Pressable>
        </View>"""
    code = code.replace(header_search_2, header_replace_2)

# 3. Add Modal to HomeScreen return
modal_code = """
      <Modal visible={showUpdateModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ width: "100%", backgroundColor: colors.surface, borderRadius: 24, overflow: "hidden" }}>
            <LinearGradient colors={[colors.surfaceSoft, colors.surface]} style={{ padding: 24, alignItems: "center", gap: 16 }}>
              <Gift color={colors.gold} size={48} />
              <NativeText style={{ fontSize: 22, fontWeight: "900", color: colors.ink }}>تحديث جديد!</NativeText>
              <NativeText style={{ fontSize: 16, lineHeight: 26, textAlign: "center", color: colors.muted }}>{updateMessage}</NativeText>
              <Pressable
                onPress={() => {
                  const version = Constants.expoConfig?.version ?? "1.5.1";
                  AsyncStorage.setItem(@update_message_seen_, "true");
                  setUpdateSeen(true);
                  setShowUpdateModal(false);
                }}
                style={{ backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, marginTop: 8 }}
              >
                <NativeText style={{ color: "#FFF", fontSize: 16, fontWeight: "900" }}>فهمت</NativeText>
              </Pressable>
            </LinearGradient>
          </View>
        </View>
      </Modal>
"""

code = code.replace('return (\n    <Screen>', 'return (\n    <Screen>' + modal_code)

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Updated HomeScreen with Update Modal")