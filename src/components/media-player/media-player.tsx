import Ionicons from "@expo/vector-icons/Ionicons";
import { Menu } from "@modules/glass-menu-android";
import { GlassView } from "@modules/glass-view-android";
import { useEvent, useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef, useState, type FC } from "react";
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassSlider } from "@/components/glass-slider";
import { MediaTransport } from "@/components/media-transport";
import { TYPOGRAPHY_FONT_FAMILY } from "@/constants/typography.const";
import { formatTime } from "@/utils/format-time.util";
import { seekTo, setLooping, setPlaybackRate, setScrubbingMode } from "@/utils/video-player.util";

import type { IMediaPlayer } from "./interface";

const SIDE = 16;
const BUTTON = 46;
const SKIP_SECONDS = 5;
const AUTO_HIDE_MS = 3500;
const FADE_MS = 220;
const SPEEDS = [0.5, 1, 1.5, 2] as const;

const MediaPlayer: FC<IMediaPlayer> = ({ source, title, onClose }) => {
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });
  const { status, error } = useEvent(player, "statusChange", { status: player.status });

  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const [loop, setLoop] = useState(true);
  const [fill, setFill] = useState(true);
  const [visible, setVisible] = useState(true);
  const [sliding, setSliding] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [touches, setTouches] = useState(0);
  const resume = useRef(false);
  const scrubbing = useRef(false);

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    if (!scrubbing.current) setTime(currentTime);
    if (player.duration > 0) setDuration(player.duration);
  });
  useEventListener(player, "sourceLoad", (event) => setDuration(event.duration));

  useEffect(() => {
    // react-native-web always reports an active screen reader.
    if (Platform.OS === "web") return;
    void AccessibilityInfo.isScreenReaderEnabled().then(setScreenReader);
    const subscription = AccessibilityInfo.addEventListener("screenReaderChanged", setScreenReader);
    return () => subscription.remove();
  }, []);

  const canHide = visible && isPlaying && !sliding && !menuOpen && !screenReader;
  useEffect(() => {
    if (!canHide) return;
    const timer = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [canHide, touches]);

  const shown = visible || screenReader;
  const fade = useAnimatedStyle(() => ({
    opacity: withTiming(shown ? 1 : 0, { duration: FADE_MS }),
  }));

  const seek = (seconds: number) => {
    const next = Math.min(duration, Math.max(0, seconds));
    seekTo(player, next);
    setTime(next);
  };

  const setScrubbing = (enabled: boolean) => {
    scrubbing.current = enabled;
    setSliding(enabled);
    setScrubbingMode(player, enabled);
  };

  const startScrub = () => {
    resume.current = player.playing;
    player.pause();
    setScrubbing(true);
  };

  const endScrub = (seconds: number) => {
    seek(seconds);
    setScrubbing(false);
    if (resume.current) player.play();
  };

  const toggle = () => {
    if (player.playing) {
      player.pause();
      return;
    }
    if (duration > 0 && player.currentTime >= duration - 0.1) player.replay();
    player.play();
  };

  const changeSpeed = (next: number) => {
    setPlaybackRate(player, next);
    setSpeed(next);
  };

  const toggleLoop = () => {
    setLooping(player, !loop);
    setLoop(!loop);
  };

  return (
    <View style={styles.screen}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit={fill ? "cover" : "contain"}
        nativeControls={false}
        // SurfaceView lives in its own layer, so the glass could not sample the video behind it.
        surfaceType="textureView"
      />
      <Pressable
        style={StyleSheet.absoluteFill}
        accessible={false}
        onPress={() => setVisible(!visible)}
      />

      {status === "error" ? (
        <View style={styles.message} pointerEvents="none">
          <Text style={styles.error}>Не удалось открыть видео</Text>
          {error ? <Text style={styles.errorDetail}>{error.message}</Text> : null}
        </View>
      ) : null}

      <Animated.View
        style={[StyleSheet.absoluteFill, fade]}
        pointerEvents={shown ? "box-none" : "none"}
        onTouchStart={() => setTouches((count) => count + 1)}
      >
        <View style={[styles.top, { top: insets.top + 8 }]} pointerEvents="box-none">
          <GlassView style={styles.button} dark blurRadius={3} tint={[0.06, 0.06, 0.08, 0.34]}>
            <Pressable
              style={styles.center}
              accessibilityRole="button"
              accessibilityLabel="Закрыть"
              onPress={onClose}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </Pressable>
          </GlassView>

          <GlassView style={styles.title} dark blurRadius={3} tint={[0.06, 0.06, 0.08, 0.34]}>
            <Text style={styles.titleText} numberOfLines={1} maxFontSizeMultiplier={1.2}>
              {title}
            </Text>
          </GlassView>

          <Menu colorScheme="dark" onOpenChange={setMenuOpen}>
            <Menu.Trigger
              accessibilityLabel="Настройки воспроизведения"
              style={styles.button}
              config={{ blur: 3, tintColor: "#0F0F14", tintOpacity: 0.34 }}
            >
              <View style={styles.center}>
                <Ionicons name="ellipsis-horizontal" size={22} color="#FFFFFF" />
              </View>
            </Menu.Trigger>
            <Menu.Content alignment="end" fontFamily={TYPOGRAPHY_FONT_FAMILY}>
              <Menu.Label>Скорость</Menu.Label>
              {SPEEDS.map((option) => (
                <Menu.Item
                  key={option}
                  id={`speed-${option}`}
                  checked={speed === option}
                  onSelect={() => changeSpeed(option)}
                >
                  <Menu.Item.Title>{`${option}×`}</Menu.Item.Title>
                </Menu.Item>
              ))}
              <Menu.Separator />
              <Menu.Item id="loop" checked={loop} keepOpen onSelect={toggleLoop}>
                <Menu.Item.Title>Повтор</Menu.Item.Title>
              </Menu.Item>
              <Menu.Item id="fill" checked={fill} keepOpen onSelect={() => setFill(!fill)}>
                <Menu.Item.Title>На весь экран</Menu.Item.Title>
              </Menu.Item>
            </Menu.Content>
          </Menu>
        </View>

        <View style={[styles.bottom, { bottom: insets.bottom + 12 }]} pointerEvents="box-none">
          <MediaTransport
            playing={isPlaying}
            skipSeconds={SKIP_SECONDS}
            onToggle={toggle}
            onSkip={(seconds) => seek(player.currentTime + seconds)}
          />
          <GlassSlider
            value={time}
            max={duration}
            step={SKIP_SECONDS}
            leading={formatTime(time)}
            trailing={`-${formatTime(duration - time)}`}
            accessibilityLabel="Перемотка"
            accessibilityText={`${formatTime(time)} из ${formatTime(duration)}`}
            onSlidingStart={startScrub}
            onValueChange={seek}
            onSlidingComplete={endScrub}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  // A web <video> keeps its intrinsic size unless width and height are explicit.
  video: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  top: {
    position: "absolute",
    left: SIDE,
    right: SIDE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  button: {
    width: BUTTON,
    height: BUTTON,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flexShrink: 1,
    height: BUTTON,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  titleText: {
    fontFamily: TYPOGRAPHY_FONT_FAMILY,
    fontSize: 16,
    color: "#FFFFFF",
  },
  bottom: {
    position: "absolute",
    left: SIDE,
    right: SIDE,
    gap: 14,
  },
  message: {
    position: "absolute",
    left: SIDE,
    right: SIDE,
    top: "42%",
    alignItems: "center",
    gap: 6,
  },
  error: {
    fontFamily: TYPOGRAPHY_FONT_FAMILY,
    fontSize: 17,
    color: "#FFFFFF",
  },
  errorDetail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
  },
});

export { MediaPlayer };
