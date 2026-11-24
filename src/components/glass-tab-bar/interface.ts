import type Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";

type TIonicon = ComponentProps<typeof Ionicons>["name"];

interface IGlassTab {
  key: string;
  title: string;
  icon: TIonicon;
  activeIcon: TIonicon;
}

interface IGlassTabBar {
  tabs: IGlassTab[];
  index: number;
  onChange: (index: number) => void;
  onSearch?: () => void;
  bottomInset: number;
}

export type { IGlassTab, IGlassTabBar, TIonicon };
