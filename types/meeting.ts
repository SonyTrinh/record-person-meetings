export type MeetingStatus = "recording" | "processing" | "completed" | "failed";

export type MeetingCard = {
  id: string;
  title: string;
  createdAt: string;
  status: MeetingStatus;
};

export type Meeting = {
  id: string;
  user_id: string;
  title: string | null;
  status: MeetingStatus;
  audio_path: string | null;
  transcript: string | null;
  summary: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FetchMode = "loading" | "refreshing" | "silent";

export type FetchMeetingsOptions = {
  showLoader?: boolean;
  mode?: FetchMode;
};
