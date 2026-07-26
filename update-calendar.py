# -*- coding: utf-8 -*-
with open('src/features/MoreScreen.tsx', 'r', encoding='utf8') as f:
    code = f.read()

# Replace calendar rendering logic to be more premium
old_cal = '''<Section title="التقويم الهجري" icon={CalendarDays}>
        {upcoming.length ? upcoming.map((day) => {
          const isToday = day.gregorian === today;
          return (
            <View key={day.gregorian} style={[styles.calendarDay, { backgroundColor: isToday ? colors.primary : day.occasion ? colors.selectedSurface : colors.surfaceSoft, borderColor: isToday ? colors.primary : colors.border, borderWidth: 1, padding: 12, borderRadius: 16 }]}>
              <View style={{ backgroundColor: isToday ? "rgba(255,255,255,0.2)" : colors.surface, width: 54, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4 }}>
                <Text style={[styles.calendarNumber, { color: isToday ? "#FFFFFF" : colors.primary, fontSize: 24, fontWeight: "900" }]}>{day.hijriDay.toLocaleString("en-US")}</Text>
              </View>
              <View style={styles.grow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[styles.rowTitle, { color: isToday ? "#FFFFFF" : colors.ink, fontSize: 16 }]}>{day.occasion ?? "اليوم"}</Text>
                  {isToday ? <Text style={{ backgroundColor: "#FFFFFF", color: colors.primary, fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, fontWeight: "900", overflow: "hidden" }}>اليوم</Text> : null}
                </View>
                <Text style={[styles.rowMeta, { color: isToday ? "rgba(255,255,255,0.8)" : colors.muted, fontSize: 13 }]}>{day.weekday} · {day.hijriMonthName} {day.hijriYear} هـ</Text>
              </View>
            </View>
          );
        }) : <Text style={[styles.body, { color: colors.muted }]}>لا توجد مناسبة محددة في بقية هذا الشهر الميلادي.</Text>}
      </Section>'''

new_cal = '''<Section title="التقويم الهجري" icon={CalendarDays}>
        {upcoming.length ? upcoming.map((day) => {
          const isToday = day.gregorian === today;
          return (
            <View key={day.gregorian} style={[styles.calendarDay, { backgroundColor: isToday ? colors.primary : colors.surface, borderColor: isToday ? colors.primary : colors.border, borderWidth: 1, padding: 16, borderRadius: 20, minHeight: 90, elevation: isToday ? 4 : 0, shadowColor: isToday ? colors.primary : "#000", shadowOpacity: isToday ? 0.2 : 0, shadowRadius: 10 }]}>
              <View style={{ backgroundColor: isToday ? "rgba(255,255,255,0.2)" : colors.surfaceSoft, width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center" }}>
                <Text style={[styles.calendarNumber, { color: isToday ? "#FFFFFF" : colors.primary, fontSize: 28, fontWeight: "900" }]}>{day.hijriDay.toLocaleString("en-US")}</Text>
              </View>
              <View style={[styles.grow, { justifyContent: "center" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={[styles.rowTitle, { color: isToday ? "#FFFFFF" : colors.ink, fontSize: 17, fontWeight: "800" }]}>{day.occasion || "يوم عادي"}</Text>
                  {isToday ? <View style={{ backgroundColor: "#FFFFFF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}><Text style={{ color: colors.primary, fontSize: 11, fontWeight: "900" }}>اليوم</Text></View> : null}
                </View>
                <Text style={[styles.rowMeta, { color: isToday ? "rgba(255,255,255,0.9)" : colors.muted, fontSize: 14, fontWeight: "600", textAlign: "right" }]}>{day.weekday} · {day.hijriMonthName} {day.hijriYear} هـ</Text>
              </View>
            </View>
          );
        }) : <Text style={[styles.body, { color: colors.muted }]}>لا توجد مناسبات قادمة.</Text>}
      </Section>'''

code = code.replace(old_cal, new_cal)
with open('src/features/MoreScreen.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Updated Hijri Calendar Design")