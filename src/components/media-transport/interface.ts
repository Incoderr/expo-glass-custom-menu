interface IMediaTransport {
  playing: boolean;
  skipSeconds: number;
  onToggle: () => void;
  onSkip: (seconds: number) => void;
}

export type { IMediaTransport };
