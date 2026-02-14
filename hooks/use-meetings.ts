import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { ensureSignedInUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { FetchMeetingsOptions, FetchMode, Meeting } from "@/types/meeting";

export const useMeetings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMeetings = useCallback(
    async ({ showLoader = true, mode }: FetchMeetingsOptions = {}) => {
      const fetchMode: FetchMode =
        mode ?? (showLoader ? "loading" : "refreshing");

      if (fetchMode === "loading") {
        setLoading(true);
      } else if (fetchMode === "refreshing") {
        setRefreshing(true);
      }

      try {
        const { user, errorMessage } = await ensureSignedInUser();

        if (!user) {
          if (errorMessage) {
            Alert.alert("Authentication required", errorMessage);
          }
          return;
        }

        const { data, error } = await supabase
          .from("meetings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          Alert.alert("Unable to load meetings", error.message);
        } else {
          setMeetings((data as Meeting[]) ?? []);
        }
      } finally {
        if (fetchMode === "loading") {
          setLoading(false);
        } else if (fetchMode === "refreshing") {
          setRefreshing(false);
        }
      }
    },
    [],
  );

  return {
    meetings,
    loading,
    refreshing,
    fetchMeetings,
  };
};
