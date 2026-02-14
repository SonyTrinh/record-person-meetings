import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { supabase } from "@/lib/supabase";
import { Meeting } from "@/types/meeting";
import { getMeetingStatusPalette } from "@/utils/home";

const MeetingDetailScreen = () => {
  const { id, meetingNo } = useLocalSearchParams<{
    id: string;
    meetingNo?: string;
  }>();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      return;
    }
    void loadMeeting(id);
  }, [id]);

  const loadMeeting = async (meetingId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", meetingId)
      .single();

    if (!error) {
      setMeeting(data as Meeting);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color="#f0444a" />
      </View>
    );
  }

  if (!meeting) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.muted}>Meeting not found.</Text>
      </View>
    );
  }

  const statusPalette = getMeetingStatusPalette(meeting.status);
  const parsedMeetingNo = Number(meetingNo);
  const hasMeetingNo = Number.isFinite(parsedMeetingNo) && parsedMeetingNo > 0;
  const meetingTitle = hasMeetingNo
    ? meeting.title
      ? `${meeting.title} #${parsedMeetingNo}`
      : `Meeting ${parsedMeetingNo}`
    : meeting.title || "Meeting";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{meetingTitle}</Text>
      <Text style={styles.meta}>
        {new Date(meeting.created_at).toLocaleDateString()} |{" "}
        {new Date(meeting.created_at).toLocaleTimeString()}
      </Text>
      <View
        style={[
          styles.statusChip,
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
          {meeting.status}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.bodyText}>
          {meeting.summary ||
            "Summary is not ready yet. You will receive a push notification."}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Transcript</Text>
        <Text style={styles.bodyText}>
          {meeting.transcript ||
            "Transcript is still processing. Pull to refresh later."}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c0f15",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0c0f15",
  },
  title: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "700",
  },
  meta: {
    color: "#9aa1ab",
  },
  statusChip: {
    alignSelf: "flex-start",
    backgroundColor: "#353a44",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statusText: {
    color: "#d5dae2",
    textTransform: "capitalize",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#1a1f28",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2f3744",
    padding: 14,
    gap: 8,
  },
  sectionTitle: {
    color: "#f4f6f8",
    fontSize: 18,
    fontWeight: "700",
  },
  bodyText: {
    color: "#c1c8d1",
    lineHeight: 22,
  },
  muted: {
    color: "#9aa1ab",
  },
});

export default MeetingDetailScreen;
