import { useHomeAnimations } from "@/hooks/use-home-animations";
import { useMeetingRecorder } from "@/hooks/use-meeting-recorder";
import { useMeetings } from "@/hooks/use-meetings";
import { Meeting } from "@/types/meeting";
import {
  formatDuration,
  getMeetingStatusPalette,
  getWaveStyle,
} from "@/utils/home";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const HomeScreen = () => {
  const { meetings, loading, refreshing, fetchMeetings } = useMeetings();

  const handleRefreshMeetings = useCallback(() => {
    fetchMeetings({ mode: "refreshing" });
  }, [fetchMeetings]);

  const refreshMeetingsSilently = useCallback(() => {
    fetchMeetings({ mode: "silent" });
  }, [fetchMeetings]);

  const { isRecording, elapsedSeconds, toggleRecording } = useMeetingRecorder({
    onRefreshMeetings: refreshMeetingsSilently,
  });

  const {
    buttonScale,
    waveAnimOne,
    waveAnimTwo,
    helperTextAnim,
    helperMessage,
    runRecordButtonPressAnimation,
  } = useHomeAnimations(isRecording);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const recordButtonText = useMemo(() => {
    if (!isRecording) {
      return "RECORD";
    }
    return `STOP\n${formatDuration(elapsedSeconds)}`;
  }, [elapsedSeconds, isRecording]);

  const handleRecordPress = async () => {
    runRecordButtonPressAnimation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleRecording();
  };

  const renderMeeting = ({ item, index }: { item: Meeting; index: number }) => {
    const statusPalette = getMeetingStatusPalette(item.status);

    return (
      <Pressable
        style={styles.meetingCard}
        onPress={() => router.push(`/meetings/${item.id}`)}
      >
        <View>
          <Text style={styles.meetingTitle}>{item.title || `Meeting`}</Text>
          <Text style={styles.meetingDate}>
            {new Date(item.created_at).toLocaleDateString()} |{" "}
            {new Date(item.created_at).toLocaleTimeString()}
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
        <View style={styles.helperTextContainer}>
          <Animated.Text
            style={[
              styles.helperText,
              {
                opacity: helperTextAnim,
                transform: [
                  {
                    translateY: helperTextAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {helperMessage}
          </Animated.Text>
        </View>
      </View>

      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Recorded voices</Text>
        </View>
        <FlatList
          data={meetings}
          keyExtractor={(item) => item.id}
          renderItem={renderMeeting}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefreshMeetings}
              tintColor="#f0444a"
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color="#f0444a" />
            ) : (
              <Text style={styles.emptyText}>No meetings yet.</Text>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
};

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
    fontSize: 17,
    lineHeight: 22,
    textAlign: "center",
  },
  helperTextContainer: {
    marginTop: 24,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 16,
    marginLeft: 4,
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

export default HomeScreen;
