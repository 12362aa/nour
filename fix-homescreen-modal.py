# -*- coding: utf-8 -*-
import re

with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

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

# Replace only the first occurrence of return ( <Screen> in HomeScreen
# To be safe, we can find "function HomeScreen" and replace the first return ( <Screen> after it.
homescreen_idx = code.find('function HomeScreen')
if homescreen_idx != -1:
    return_idx = code.find('return (\n    <Screen>', homescreen_idx)
    if return_idx != -1:
        code = code[:return_idx] + 'return (\n    <Screen>' + modal_code + code[return_idx + len('return (\n    <Screen>'):]

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Injected Modal into HomeScreen correctly")