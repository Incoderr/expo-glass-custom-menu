import type { VideoPlayer } from "expo-video";
import { Platform } from "react-native";

// expo-video is controlled by assigning to the player. Keeping the writes here lets
// React Compiler treat the player as an external object instead of mutated hook state.
const seekTo = (player: VideoPlayer, seconds: number): void => {
  player.currentTime = seconds;
};

const setPlaybackRate = (player: VideoPlayer, rate: number): void => {
  player.playbackRate = rate;
};

const setLooping = (player: VideoPlayer, loop: boolean): void => {
  player.loop = loop;
};

const setScrubbingMode = (player: VideoPlayer, enabled: boolean): void => {
  if (Platform.OS === "web") return;
  player.scrubbingModeOptions = { scrubbingModeEnabled: enabled };
};

export { seekTo, setLooping, setPlaybackRate, setScrubbingMode };
