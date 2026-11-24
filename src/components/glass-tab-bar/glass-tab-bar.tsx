import Ionicons from "@expo/vector-icons/Ionicons";
import { GlassView, type TLensFrame } from "@modules/glass-view-android";
import { useRef, useState, type FC } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
} from "react-native";
import type { IGlassTabBar } from "./interface";

const BAR_HEIGHT = 64;
const INSET = 4;
const GAP = 10;
const SIDE = 16;
const ACTIVE = "#2F8CFF";
const IDLE = "#FFFFFF";

const GlassTabBar: FC<IGlassTabBar> = ({ tabs, index, onChange, onSearch, bottomInset }) => {
  const { width } = useWindowDimensions();
  const barWidth = width - SIDE * 2 - GAP - BAR_HEIGHT;
  const tabWidth = (barWidth - INSET * 2) / tabs.length;
  const [pressed, setPressed] = useState(false);
  const [dragX, setDragX] = useState<number | null>(null);
  const [hover, setHover] = useState(index);
  const [searchPressed, setSearchPressed] = useState(false);
  const last = useRef(index);

  const indexAt = (x: number) =>
    Math.max(0, Math.min(tabs.length - 1, Math.floor((x - INSET) / tabWidth)));

  const frameFor = (i: number): TLensFrame => [INSET + i * tabWidth, INSET, tabWidth, BAR_HEIGHT - INSET * 2];

  const lensFrame: TLensFrame =
    dragX === null
      ? frameFor(index)
      : [
          Math.max(INSET, Math.min(barWidth - INSET - tabWidth, dragX - tabWidth / 2)),
          INSET,
          tabWidth,
          BAR_HEIGHT - INSET * 2,
        ];

  const track = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX;
    setDragX(x);
    const i = indexAt(x);
    if (i !== last.current) {
      last.current = i;
      setHover(i);
    }
  };

  const start = (e: GestureResponderEvent) => {
    last.current = indexAt(e.nativeEvent.locationX);
    setHover(last.current);
    setPressed(true);
    track(e);
  };

  const end = () => {
    setPressed(false);
    setDragX(null);
    if (last.current !== index) onChange(last.current);
  };

  const highlighted = pressed ? hover : index;

  return (
    <View style={[styles.row, { bottom: bottomInset + 8 }]} pointerEvents="box-none">
      <GlassView
        style={{ width: barWidth, height: BAR_HEIGHT }}
        dark
        blurRadius={2}
        saturation={1.6}
        tint={[0.08, 0.08, 0.1, 0.42]}
        restColor={[1, 1, 1, 0.13]}
        lensFrame={lensFrame}
        lensPressed={pressed}
        lensMagnify={1.18}
        lensScale={1.22}
      >
        <View
          style={styles.tabs}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={start}
          onResponderMove={track}
          onResponderRelease={end}
          onResponderTerminate={end}
        >
          {tabs.map((tab, i) => {
            const on = i === highlighted;
            const color = on ? ACTIVE : IDLE;
            return (
              <View key={tab.key} style={[styles.tab, { width: tabWidth }]} pointerEvents="none">
                <Ionicons name={on ? tab.activeIcon : tab.icon} size={24} color={color} />
                <Text style={[styles.label, { color }]} numberOfLines={1}>
                  {tab.title}
                </Text>
              </View>
            );
          })}
        </View>
      </GlassView>

      <GlassView
        style={{ width: BAR_HEIGHT, height: BAR_HEIGHT }}
        dark
        blurRadius={2}
        saturation={1.6}
        tint={[0.08, 0.08, 0.1, 0.42]}
        restColor={[1, 1, 1, 0]}
        lensFrame={[0, 0, BAR_HEIGHT, BAR_HEIGHT]}
        lensPressed={searchPressed}
        lensMagnify={1.25}
        lensScale={1.12}
      >
        <Pressable
          style={styles.search}
          onPressIn={() => {
            setSearchPressed(true);
          }}
          onPressOut={() => setSearchPressed(false)}
          onPress={onSearch}
          accessibilityLabel="Поиск"
        >
          <Ionicons name="search" size={26} color={IDLE} />
        </Pressable>
      </GlassView>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    position: "absolute",
    left: SIDE,
    right: SIDE,
    flexDirection: "row",
    alignItems: "center",
    gap: GAP,
  },
  tabs: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: INSET,
    alignItems: "center",
  },
  tab: {
    height: BAR_HEIGHT - INSET * 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: {
    fontFamily: "SF-Pro-Rounded-Medium",
    fontSize: 11,
  },
  search: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export { GlassTabBar };
