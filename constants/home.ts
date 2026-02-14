export type MeetingStatus = "recording" | "processing" | "done" | "failed";

export type MeetingCard = {
  id: string;
  title: string;
  createdAt: string;
  status: MeetingStatus;
};

export const SAMPLE_MEETINGS: MeetingCard[] = [
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

export const REFRESH_DELAY_MS = 1000;
