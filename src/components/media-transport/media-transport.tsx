import Ionicons from "@expo/vector-icons/Ionicons";
import { GlassView } from "@modules/glass-view-android";
import { useState, type FC } from "react";
import { Pressable, StyleSheet } from "react-native";

import type { IMediaTransport } from "./interface";

const CELL = 68;
const HEIGHT = 64;
const INSET = 4;

const MediaTransport: FC<IMediaTransport> = ({ playing, skipSeconds, onToggle, onSkip }) => {
  const [active, setActive] = useState(1);
  const [pressed, setPressed] = useState(false);

  const buttons = [
    {
      key: "back",
      icon: "play-back",
      size: 24,
      label: `Назад на ${skipSeconds} секунд`,
      onPress: () => onSkip(-skipSeconds),
    },
    {
      key: "toggle",
      icon: playing ? "pause" : "play",
      size: 34,
      label: playing ? "Пауза" : "Воспроизвести",
      onPress: onToggle,
    },
    {
      key: "forward",
      icon: "play-forward",
      size: 24,
      label: `Вперёд на ${skipSeconds} секунд`,
      onPress: () => onSkip(skipSeconds),
    },
  ] as const;

  return (
    <GlassView
      style={styles.bar}
      dark
      blurRadius={3}
      saturation={1.6}
      tint={[0.06, 0.06, 0.08, 0.34]}
      restColor={[1, 1, 1, 0]}
      lensFrame={[INSET + active * CELL, INSET, CELL, HEIGHT - INSET * 2]}
      lensPressed={pressed}
      lensMagnify={1.2}
      lensScale={1.15}
    >
      {buttons.map((button, index) => (
        <Pressable
          key={button.key}
          style={styles.cell}
          accessibilityRole="button"
          accessibilityLabel={button.label}
          onPressIn={() => {
            setActive(index);
            setPressed(true);
          }}
          onPressOut={() => setPressed(false)}
          onPress={button.onPress}
        >
          <Ionicons name={button.icon} size={button.size} color="#FFFFFF" />
        </Pressable>
      ))}
    </GlassView>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignSelf: "center",
    width: CELL * 3 + INSET * 2,
    height: HEIGHT,
    padding: INSET,
  },
  cell: {
    width: CELL,
    height: HEIGHT - INSET * 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

export { MediaTransport };
