import { decode } from "base64-arraybuffer";
import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import Constants from "expo-constants";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking } from "react-native";

import { ensureSignedInUser } from "@/lib/auth";
import { getCachedPushToken } from "@/lib/notifications";
import { supabase } from "@/lib/supabase";

type ActiveRecording = {
  meetingId: string;
  startedAt: number;
};

type UseMeetingRecorderParams = {
  onRefreshMeetings?: () => void | Promise<void>;
};

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const AUDIO_BUCKET = "meeting-audio";

export const useMeetingRecorder = ({
  onRefreshMeetings,
}: UseMeetingRecorderParams = {}) => {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [activeRecording, setActiveRecording] =
    useState<ActiveRecording | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const isRecording = Boolean(activeRecording);

  useEffect(() => {
    if (!activeRecording) {
      setElapsedSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds(
        Math.max(0, (Date.now() - activeRecording.startedAt) / 1000),
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [activeRecording]);

  const getResolvedBackendUrl = useCallback(() => {
    if (!BACKEND_URL) {
      return null;
    }

    try {
      const parsedUrl = new URL(BACKEND_URL);
      const isLocalHost =
        parsedUrl.hostname === "localhost" ||
        parsedUrl.hostname === "127.0.0.1" ||
        parsedUrl.hostname === "::1";

      if (!isLocalHost) {
        return BACKEND_URL.replace(/\/+$/, "");
      }

      const expoHostUri =
        Constants.expoConfig?.hostUri ??
        Constants.expoGoConfig?.debuggerHost ??
        null;
      const expoHost = expoHostUri?.split(":")[0];
      if (!expoHost) {
        return null;
      }

      parsedUrl.hostname = expoHost;
      return parsedUrl.toString().replace(/\/+$/, "");
    } catch {
      return null;
    }
  }, []);

  const ensureMicrophonePermission = useCallback(async () => {
    try {
      const currentPermission = await getRecordingPermissionsAsync();
      if (currentPermission.granted) {
        return true;
      }

      if (!currentPermission.canAskAgain) {
        Alert.alert(
          "Microphone permission required",
          "Please enable microphone access in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                void Linking.openSettings();
              },
            },
          ],
        );
        return false;
      }

      const requestedPermission = await requestRecordingPermissionsAsync();
      return requestedPermission.granted;
    } catch {
      // Fall back to recorder-level permission checks if the permission bridge fails.
      return true;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const hasMicrophonePermission = await ensureMicrophonePermission();
      if (!hasMicrophonePermission) {
        return;
      }

      const { user, errorMessage } = await ensureSignedInUser();

      if (!user) {
        Alert.alert(
          "Unable to sign in",
          errorMessage ??
            "Enable Anonymous sign-ins in Supabase, then restart the app and try again.",
        );
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        allowsBackgroundRecording: true,
        shouldRouteThroughEarpiece: false,
        interruptionMode: "duckOthers",
      });

      const { data: meeting, error: insertError } = await supabase
        .from("meetings")
        .insert({
          user_id: user.id,
          status: "recording",
          started_at: new Date().toISOString(),
          title: "New meeting",
        })
        .select("*")
        .single();

      if (insertError || !meeting) {
        Alert.alert(
          "Could not start meeting",
          insertError?.message ?? "Unknown error",
        );
        return;
      }

      await recorder.prepareToRecordAsync();
      recorder.record();

      setActiveRecording({
        meetingId: meeting.id,
        startedAt: Date.now(),
      });

      await onRefreshMeetings?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected recording error.";
      Alert.alert("Recording failed", message);
    }
  }, [ensureMicrophonePermission, onRefreshMeetings, recorder]);

  const stopRecording = useCallback(async () => {
    if (!activeRecording) {
      return;
    }

    const { meetingId } = activeRecording;
    setActiveRecording(null);

    try {
      await recorder.stop();
      const fileUri = recorder.uri ?? recorder.getStatus().url;

      if (!fileUri) {
        throw new Error("Could not read recording file.");
      }

      const { user, errorMessage } = await ensureSignedInUser();

      if (!user) {
        throw new Error(errorMessage ?? "Missing authenticated user.");
      }

      const base64Audio = await FileSystemLegacy.readAsStringAsync(fileUri, {
        encoding: "base64",
      });
      const audioBuffer = decode(base64Audio);
      const audioPath = `${user.id}/${meetingId}.m4a`;

      const { error: uploadError } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(audioPath, audioBuffer, {
          upsert: true,
          contentType: "audio/mp4",
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const pushToken = await getCachedPushToken();

      const { error: updateError } = await supabase
        .from("meetings")
        .update({
          status: "processing",
          audio_path: audioPath,
          ended_at: new Date().toISOString(),
        })
        .eq("id", meetingId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      const backendUrl = getResolvedBackendUrl();
      if (backendUrl) {
        try {
          const response = await fetch(`${backendUrl}/process-meeting`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              meetingId,
              userId: user.id,
              audioPath,
              pushToken,
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            console.warn("Processing trigger failed:", response.status, text);
            await supabase
              .from("meetings")
              .update({ status: "failed" })
              .eq("id", meetingId);
            Alert.alert(
              "Processing could not start",
              `Backend returned ${response.status}. Please check backend logs.`,
            );
          }
        } catch (backendError) {
          console.warn(
            "Backend unreachable while triggering processing:",
            backendError,
          );
          await supabase
            .from("meetings")
            .update({ status: "failed" })
            .eq("id", meetingId);
          Alert.alert(
            "Backend unreachable",
            "Could not reach processing server. If you are on a phone, set EXPO_PUBLIC_BACKEND_URL to your computer LAN IP, e.g. http://192.168.x.x:8000.",
          );
        }
      } else {
        await supabase
          .from("meetings")
          .update({ status: "failed" })
          .eq("id", meetingId);
        Alert.alert(
          "Missing backend URL",
          "Set EXPO_PUBLIC_BACKEND_URL in .env to a reachable URL, then restart Expo.",
        );
      }

      await onRefreshMeetings?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unexpected stop/upload error.";
      Alert.alert("Could not finish recording", message);

      await supabase
        .from("meetings")
        .update({ status: "failed" })
        .eq("id", meetingId);
      await onRefreshMeetings?.();
    }
  }, [activeRecording, getResolvedBackendUrl, onRefreshMeetings, recorder]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
      return;
    }

    await startRecording();
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    elapsedSeconds,
    toggleRecording,
  };
};
