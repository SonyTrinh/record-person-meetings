import { Animated, Easing } from "react-native";

import type { MeetingStatus } from "../constants/home";

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
    case "done":
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

export const startWaveLoops = (
  waveAnimOne: Animated.Value,
  waveAnimTwo: Animated.Value,
) => {
  const buildWaveLoop = (value: Animated.Value, delay: number) =>
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

  const waveOneLoop = buildWaveLoop(waveAnimOne, 0);
  const waveTwoLoop = buildWaveLoop(waveAnimTwo, 900);

  waveOneLoop.start();
  waveTwoLoop.start();

  return () => {
    waveOneLoop.stop();
    waveTwoLoop.stop();
    waveAnimOne.setValue(0);
    waveAnimTwo.setValue(0);
  };
};
