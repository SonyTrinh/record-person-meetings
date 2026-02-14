import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MeetingCard = {
  id: string;
  title: string;
  createdAt: string;
  status: "recording" | "processing" | "done" | "failed";
};

const SAMPLE_MEETINGS: MeetingCard[] = [
  {
    id: "1",
    title: "Sprint planning",
    createdAt: "2026-02-12T09:30:00.000Z",
    status: "done",
  },
  {
    id: "2",
    title: "Design review",
    createdAt: "2026-02-13T14:15:00.000Z",
    status: "processing",
  },
];

const getMeetingStatusPalette = (status: MeetingCard["status"]) => {
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

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

export default function HomeScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const waveAnimOne = useRef(new Animated.Value(0)).current;
  const waveAnimTwo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isRecording) {
      setElapsedSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const recordButtonText = useMemo(() => {
    if (!isRecording) {
      return "RECORD";
    }
    return `STOP\n${formatDuration(elapsedSeconds)}`;
  }, [elapsedSeconds, isRecording]);

  useEffect(() => {
    if (!isRecording) {
      waveAnimOne.stopAnimation();
      waveAnimTwo.stopAnimation();
      waveAnimOne.setValue(0);
      waveAnimTwo.setValue(0);
      return;
    }

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
  }, [isRecording, waveAnimOne, waveAnimTwo]);

  const handleRecordPress = async () => {
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

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording((prev) => !prev);
  };

  const getWaveStyle = (value: Animated.Value) => ({
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

  const renderMeeting = ({ item }: { item: MeetingCard }) => {
    const statusPalette = getMeetingStatusPalette(item.status);

    return (
      <Pressable style={styles.meetingCard} onPress={() => {}}>
        <View>
          <Text style={styles.meetingTitle}>{item.title || "Meeting"}</Text>
          <Text style={styles.meetingDate}>
            {new Date(item.createdAt).toLocaleDateString()} |{" "}
            {new Date(item.createdAt).toLocaleTimeString()}
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: statusPalette.pillBackground,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: statusPalette.text,
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerSection}>
        <View style={styles.recordArea}>
          {isRecording && (
            <>
              <Animated.View
                pointerEvents="none"
                style={[styles.waveRing, getWaveStyle(waveAnimOne)]}
              />
              <Animated.View
                pointerEvents="none"
                style={[styles.waveRing, getWaveStyle(waveAnimTwo)]}
              />
            </>
          )}

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
              ]}
              onPress={handleRecordPress}
            >
              <View style={styles.recordInner}>
                <Text style={styles.recordText}>{recordButtonText}</Text>
              </View>
            </Pressable>
          </Animated.View>
        </View>
        <Text style={styles.helperText}>
          {isRecording
            ? "Recording in background is enabled. You can lock your screen."
            : "Tap the record button to start recording"}
        </Text>
      </View>

      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Recorded voices</Text>
        </View>
        <FlatList
          data={SAMPLE_MEETINGS}
          keyExtractor={(item) => item.id}
          renderItem={renderMeeting}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#f0444a"
              progressBackgroundColor="#090b10"
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No meetings yet.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090b10",
  },
  topBar: {
    backgroundColor: "#3b1317",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#4c2024",
  },
  title: {
    color: "#f4f4f4",
    fontSize: 34,
    fontWeight: "700",
  },
  centerSection: {
    alignItems: "center",
    marginTop: 36,
    paddingHorizontal: 24,
  },
  recordArea: {
    width: 250,
    height: 250,
    alignItems: "center",
    justifyContent: "center",
  },
  waveRing: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#f0444a",
  },
  recordButton: {
    width: 220,
    height: 220,
    borderRadius: 120,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#772128",
  },
  recordButtonActive: {
    backgroundColor: "#a1252c",
  },
  recordInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0444a",
  },
  recordText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 26,
    fontWeight: "800",
  },
  helperText: {
    color: "#b8b8b8",
    marginTop: 24,
    fontSize: 17,
    textAlign: "center",
  },
  listContainer: {
    flex: 1,
    marginTop: 28,
    backgroundColor: "#121419",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  listTitle: {
    color: "#f1f1f1",
    fontSize: 22,
    fontWeight: "700",
  },
  seeAll: {
    color: "#f06a6f",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    gap: 12,
    paddingBottom: 28,
  },
  meetingCard: {
    backgroundColor: "#24262d",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#343842",
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  meetingTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  meetingDate: {
    color: "#9da3ad",
    marginTop: 4,
  },
  statusPill: {
    backgroundColor: "#3a3e46",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statusText: {
    color: "#d7d9dc",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  emptyText: {
    color: "#9da3ad",
    textAlign: "center",
    marginTop: 24,
  },
});
