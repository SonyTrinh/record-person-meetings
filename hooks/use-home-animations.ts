import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";

import { startWaveLoops } from "../utils/home";

const RECORDING_HELPER_TEXT =
  "Recording in background is enabled. You can lock your screen.";
const IDLE_HELPER_TEXT = "Tap the record button to start recording";

export const useHomeAnimations = (isRecording: boolean) => {
  const [helperMessage, setHelperMessage] = useState(IDLE_HELPER_TEXT);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const waveAnimOne = useRef(new Animated.Value(0)).current;
  const waveAnimTwo = useRef(new Animated.Value(0)).current;
  const helperTextAnim = useRef(new Animated.Value(1)).current;
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!isRecording) {
      waveAnimOne.stopAnimation();
      waveAnimTwo.stopAnimation();
      waveAnimOne.setValue(0);
      waveAnimTwo.setValue(0);
      return;
    }

    return startWaveLoops(waveAnimOne, waveAnimTwo);
  }, [isRecording, waveAnimOne, waveAnimTwo]);

  useEffect(() => {
    const nextMessage = isRecording ? RECORDING_HELPER_TEXT : IDLE_HELPER_TEXT;

    if (!hasMounted.current) {
      hasMounted.current = true;
      setHelperMessage(nextMessage);
      return;
    }

    helperTextAnim.stopAnimation();
    Animated.timing(helperTextAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setHelperMessage(nextMessage);
      Animated.timing(helperTextAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  }, [helperTextAnim, isRecording]);

  const runRecordButtonPressAnimation = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.94,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return {
    buttonScale,
    waveAnimOne,
    waveAnimTwo,
    helperTextAnim,
    helperMessage,
    runRecordButtonPressAnimation,
  };
};
