import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { FC } from "react";

import { MediaPlayer } from "@/components/media-player";

const LANDSCAPES: number = require("../../assets/media/landscapes.mp4");

const close = (): void => (router.canGoBack() ? router.back() : router.replace("/"));

const Media: FC = () => (
  <>
    {/* The glass overlay does not follow slide transitions, so fade instead. */}
    <Stack.Screen options={{ animation: "fade" }} />
    <StatusBar style="light" />
    <MediaPlayer source={LANDSCAPES} title="Пейзажи" onClose={close} />
  </>
);

export default Media;
