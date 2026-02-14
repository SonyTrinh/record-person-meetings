import { Animated } from "react-native";

import type { MeetingStatus } from "@/types/meeting";

export const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

export const getMeetingStatusPalette = (status: MeetingStatus) => {
  switch (status) {
    case "recording":
      return { pillBackground: "#6d2329", text: "#ff8b90" };
    case "processing":
      return { pillBackground: "#4d3920", text: "#ffcf8a" };
    case "completed":
      return { pillBackground: "#1f4a37", text: "#7ef3c1" };
    default:
      return { pillBackground: "#4a2222", text: "#ff9e9e" };
  }
};

export const getWaveStyle = (value: Animated.Value) => ({
  opacity: value.interpolate({
    inputRange: [0, 0.65, 1],
    outputRange: [0.36, 0.2, 0],
  }),
  transform: [
    {
      scale: value.interpolate({
        inputRange: [0, 1],
        outputRange: [0.86, 1.55],
      }),
    },
  ],
});
