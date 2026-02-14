import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

const handleDeepLink = (deepLink: string, meetingId: string | null) => {
  const parsed = Linking.parse(deepLink);
  const path = parsed.path?.replace(/^\/+/, "");
  if (path?.startsWith("meetings/")) {
    const meetingIdFromLink = path.split("/")[1];
    if (meetingIdFromLink) {
      router.push({
        pathname: "/meetings/[id]",
        params: { id: meetingIdFromLink },
      });
      return;
    }
  }
  if (path === "") {
    router.push("/");
    return;
  }
};

export function handleNotification(
  response: Notifications.NotificationResponse,
) {
  const data = response.notification.request.content.data;
  const deepLink = typeof data.url === "string" ? data.url : null;
  const meetingId = typeof data.meetingId === "string" ? data.meetingId : null;

  if (deepLink) {
    handleDeepLink(deepLink, meetingId);
  }
  if (meetingId) {
    router.push({
      pathname: "/meetings/[id]",
      params: { id: meetingId },
    });
  }
}
