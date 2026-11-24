import type { FC } from "react";
import { View } from "react-native";
import type { IGlassView } from "./interface";

const GlassView: FC<IGlassView> = ({ cornerRadius, dark = true, style, children, ...rest }) => (
  <View
    {...rest}
    style={[
      {
        borderRadius: cornerRadius ?? 999,
        backgroundColor: dark ? "rgba(30,30,34,0.85)" : "rgba(245,245,247,0.9)",
        overflow: "hidden",
      },
      style,
    ]}
  >
    {children}
  </View>
);

export { GlassView };
