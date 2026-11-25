import { GlassTabBar, type IGlassTab } from "@/components/glass-tab-bar";
import { Image } from "expo-image";
import { Link, useIsFocused } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState, type FC } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TABS: IGlassTab[] = [
  { key: "home", title: "Home", icon: "home-outline", activeIcon: "home" },
  { key: "tv", title: "Apple TV+", icon: "tv-outline", activeIcon: "tv" },
  { key: "store", title: "Store", icon: "bag-handle-outline", activeIcon: "bag-handle" },
  { key: "library", title: "Library", icon: "albums-outline", activeIcon: "albums" },
];

const SECTIONS = ["Сейчас смотрят", "Новое", "Для тебя", "Классика", "Ещё раз"];

const Index: FC = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState(0);
  const focused = useIsFocused();
  const card = (width - 16 * 2 - 12) / 2;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        key={TABS[tab].key}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 }}
      >
        <Text style={styles.h1}>{TABS[tab].title}</Text>
        <Image
          source={{ uri: `https://picsum.photos/seed/${TABS[tab].key}-hero/900/600` }}
          style={[styles.hero, { width: width - 32, height: (width - 32) * 0.62 }]}
          transition={200}
        />
        {SECTIONS.map((section, s) => (
          <View key={section}>
            <Text style={styles.h2}>{section}</Text>
            <View style={styles.grid}>
              {[0, 1, 2, 3].map((n) => (
                <Image
                  key={n}
                  source={{ uri: `https://picsum.photos/seed/${TABS[tab].key}-${s}-${n}/500/500` }}
                  style={[styles.card, { width: card, height: card }]}
                  transition={200}
                />
              ))}
            </View>
          </View>
        ))}
        <Link href="/media" style={styles.link}>
          Видео со стеклянным плеером →
        </Link>
        <Link href="/showcase" style={styles.link}>
          Демо меню от автора →
        </Link>
      </ScrollView>

      {/* Glass draws above the whole window, so it must not outlive this screen during navigation. */}
      {focused ? (
        <GlassTabBar tabs={TABS} index={tab} onChange={setTab} bottomInset={insets.bottom} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  h1: { color: "#fff", fontSize: 34, fontFamily: "SF-Pro-Rounded-Medium", paddingHorizontal: 16, marginBottom: 12 },
  h2: { color: "#fff", fontSize: 20, fontFamily: "SF-Pro-Rounded-Medium", paddingHorizontal: 16, marginTop: 24, marginBottom: 10 },
  hero: { marginHorizontal: 16, borderRadius: 22, backgroundColor: "#1c1c22" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16 },
  card: { borderRadius: 16, backgroundColor: "#1c1c22" },
  link: { color: "#2F8CFF", textAlign: "center", marginTop: 28, fontSize: 16 },
});

export default Index;
