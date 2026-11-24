import type { ViewProps } from "react-native";

type TRgba = [number, number, number, number];

type TLensFrame = [number, number, number, number];

interface IGlassView extends ViewProps {
  cornerRadius?: number;
  blurRadius?: number;
  saturation?: number;
  refraction?: number;
  rim?: number;
  dark?: boolean;
  live?: boolean;
  tint?: TRgba;
  lensTint?: TRgba;
  restColor?: TRgba;
  lensFrame?: TLensFrame | null;
  lensRadius?: number;
  lensPressed?: boolean;
  lensMagnify?: number;
  lensScale?: number;
}

export type { IGlassView, TLensFrame, TRgba };
