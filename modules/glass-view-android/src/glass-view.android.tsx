import { requireNativeView } from "expo";
import type { ComponentType } from "react";
import type { IGlassView } from "./interface";

const GlassView: ComponentType<IGlassView> = requireNativeView<IGlassView>("GlassViewAndroid");

export { GlassView };
