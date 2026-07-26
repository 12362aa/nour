# -*- coding: utf-8 -*-
import os

with open('src/features/MoreScreen.tsx', 'r', encoding='utf8') as f:
    code = f.read()

grid_code = """
        <Section title="التقويم الهجري (للشهر الحالي)" icon={CalendarDays}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8, paddingHorizontal: 4 }}>
            {["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"].map((d) => (
              <Text key={d} style={{ color: colors.muted, fontSize: 12, fontWeight: "700", width: "13%", textAlign: "center" }}>{d}</Text>
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: "2%" }}>
            {calendar.length > 0 && Array.from({ length: new Date(calendar[0].gregorian.split("-").reverse().join("-")).getDay() }).map((_, i) => (
              <View key={empty-} style={{ width: "12.5%", height: 44, marginBottom: 8 }} />
            ))}
            {calendar.map((day) => {
              const isToday = day.gregorian === today;
              return (
                <Pressable
                  key={day.gregorian}
                  onPress={() => {
                    if (day.occasion) showToast(day.occasion);
                    else showToast(${day.hijriDay}  );
                  }}
                  style={{
                    width: "12.5%",
                    height: 44,
                    marginBottom: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isToday ? colors.primary : day.occasion ? colors.selectedSurface : colors.surfaceSoft,
                    borderColor: isToday ? colors.primary : colors.border,
                    borderWidth: 1,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: isToday ? "#FFFFFF" : colors.primary, fontSize: 16, fontWeight: "900" }}>
                    {day.hijriDay.toLocaleString("en-US")}
                  </Text>
                  {day.occasion && !isToday && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.gold, position: "absolute", bottom: 4 }} />}
                </Pressable>
              );
            })}
          </View>
          {upcoming.length > 0 && (
            <View style={{ marginTop: 16, gap: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text style={{ color: colors.ink, fontWeight: "700", marginBottom: 4 }}>أهم المناسبات القادمة:</Text>
              {upcoming.map((day) => (
                <View key={occ-} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold }} />
                  <Text style={{ color: colors.ink, fontSize: 14 }}>{day.occasion}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>({day.hijriDay} {day.hijriMonthName})</Text>
                </View>
              ))}
            </View>
          )}
        </Section>
"""

# Replace the old <Section title="المناسبات الإسلامية" icon={CalendarDays}> ... </Section>
start_marker = '<Section title="المناسبات الإسلامية" icon={CalendarDays}>'
end_marker = '</Section>\n    </ScrollView>'

# Wait, the title was "المناسبات الإسلامية"? Let me check the cat output.
# The cat output showed: <Section title="??????? ??????" icon={CalendarDays}>
# This is "المناسبات الإسلامية".

import re
code = re.sub(r'<Section title="المناسبات الإسلامية" icon=\{CalendarDays\}>.*?</Section>', grid_code.strip(), code, flags=re.DOTALL)

with open('src/features/MoreScreen.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Updated MoreScreen.tsx Grid")