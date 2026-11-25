import type { StyleProp, ViewStyle } from "react-native";

interface IGlassSlider {
  value: number;
  max: number;
  step?: number;
  leading?: string;
  trailing?: string;
  accessibilityLabel: string;
  accessibilityText?: string;
  style?: StyleProp<ViewStyle>;
  onSlidingStart?: () => void;
  onValueChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
}

export type { IGlassSlider };
