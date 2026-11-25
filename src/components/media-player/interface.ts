import type { VideoSource } from "expo-video";

interface IMediaPlayer {
  source: VideoSource;
  title: string;
  onClose: () => void;
}

export type { IMediaPlayer };
