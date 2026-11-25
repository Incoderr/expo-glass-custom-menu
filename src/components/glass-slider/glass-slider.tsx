import { GlassView, type TLensFrame } from "@modules/glass-view-android";
import { useRef, useState, type FC } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";

import { TYPOGRAPHY_FONT_FAMILY } from "@/constants/typography.const";

import type { IGlassSlider } from "./interface";

const HEIGHT = 52;
const PADDING = 16;
const LABEL_WIDTH = 46;
const TRACK_HEIGHT = 6;
const THUMB_WIDTH = 34;
const THUMB_HEIGHT = 22;
// Below Android 13 and on other platforms there is no lens, so the thumb must stay visible.
const HAS_LENS = Platform.OS === "android" && Number(Platform.Version) >= 33;

const GlassSlider: FC<IGlassSlider> = ({
  value,
  max,
  step = 1,
  leading,
  trailing,
  accessibilityLabel,
  accessibilityText,
  style,
  onSlidingStart,
  onValueChange,
  onSlidingComplete,
}) => {
  const [width, setWidth] = useState(0);
  const [pressed, setPressed] = useState(false);
  const grab = useRef({ localX: 0, pageX: 0 });
  const latest = useRef(value);

  const trackLeft = PADDING + (leading === undefined ? 0 : LABEL_WIDTH);
  const trackRight = width - PADDING - (trailing === undefined ? 0 : LABEL_WIDTH);
  const travel = Math.max(1, trackRight - trackLeft - THUMB_WIDTH);
  const progress = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const thumbLeft = trackLeft + progress * travel;
  const disabled = max <= 0;

  const lensFrame: TLensFrame | null =
    width > 0 ? [thumbLeft, (HEIGHT - THUMB_HEIGHT) / 2, THUMB_WIDTH, THUMB_HEIGHT] : null;

  const emit = (x: number) => {
    const ratio = (x - trackLeft - THUMB_WIDTH / 2) / travel;
    latest.current = Math.min(1, Math.max(0, ratio)) * max;
    onValueChange(latest.current);
  };

  const start = ({ nativeEvent }: GestureResponderEvent) => {
    grab.current = { localX: nativeEvent.locationX, pageX: nativeEvent.pageX };
    setPressed(true);
    onSlidingStart?.();
    emit(nativeEvent.locationX);
  };

  // pageX keeps tracking correctly once the finger leaves the capsule.
  const move = ({ nativeEvent }: GestureResponderEvent) =>
    emit(grab.current.localX + nativeEvent.pageX - grab.current.pageX);

  const end = () => {
    setPressed(false);
    onSlidingComplete?.(latest.current);
  };

  const onAccessibilityAction = ({ nativeEvent }: AccessibilityActionEvent) => {
    const delta = nativeEvent.actionName === "increment" ? step : -step;
    const next = Math.min(max, Math.max(0, value + delta));
    onSlidingStart?.();
    onValueChange(next);
    onSlidingComplete?.(next);
  };

  return (
    <GlassView
      style={[styles.capsule, style]}
      dark
      blurRadius={3}
      saturation={1.6}
      tint={[0.06, 0.06, 0.08, 0.34]}
      restColor={[1, 1, 1, 0]}
      lensFrame={lensFrame}
      lensPressed={pressed}
      lensMagnify={1.15}
      lensScale={1.55}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      <View
        style={styles.hit}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        accessibilityValue={{
          min: 0,
          max: Math.round(max),
          now: Math.round(value),
          text: accessibilityText,
        }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={onAccessibilityAction}
        onStartShouldSetResponder={() => !disabled}
        onMoveShouldSetResponder={() => !disabled}
        onResponderTerminationRequest={() => false}
        onResponderGrant={start}
        onResponderMove={move}
        onResponderRelease={end}
        onResponderTerminate={end}
      >
        {leading === undefined ? null : (
          <Text style={[styles.label, styles.leading]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
            {leading}
          </Text>
        )}
        {width > 0 ? (
          <>
            <View style={[styles.track, { left: trackLeft, width: trackRight - trackLeft }]} />
            <View
              style={[
                styles.track,
                styles.fill,
                { left: trackLeft, width: thumbLeft - trackLeft + THUMB_WIDTH / 2 },
              ]}
            />
            <View
              style={[styles.thumb, { left: thumbLeft, opacity: pressed && HAS_LENS ? 0 : 1 }]}
            />
          </>
        ) : null}
        {trailing === undefined ? null : (
          <Text
            style={[styles.label, styles.trailing]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
          >
            {trailing}
          </Text>
        )}
      </View>
    </GlassView>
  );
};

const styles = StyleSheet.create({
  capsule: {
    height: HEIGHT,
  },
  hit: {
    flex: 1,
  },
  label: {
    position: "absolute",
    top: (HEIGHT - 18) / 2,
    width: LABEL_WIDTH,
    lineHeight: 18,
    fontFamily: TYPOGRAPHY_FONT_FAMILY,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    userSelect: "none",
    color: "#FFFFFF",
    pointerEvents: "none",
  },
  leading: {
    left: PADDING,
  },
  trailing: {
    right: PADDING,
    textAlign: "right",
  },
  track: {
    position: "absolute",
    top: (HEIGHT - TRACK_HEIGHT) / 2,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: "rgba(255,255,255,0.28)",
    pointerEvents: "none",
  },
  fill: {
    backgroundColor: "#FFFFFF",
  },
  thumb: {
    position: "absolute",
    top: (HEIGHT - THUMB_HEIGHT) / 2,
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: THUMB_HEIGHT / 2,
    backgroundColor: "#FFFFFF",
    pointerEvents: "none",
  },
});

export { GlassSlider };
