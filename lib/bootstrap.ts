import { ensureSignedInUser } from "@/lib/auth";
import { registerForPushNotificationsAsync } from "@/lib/notifications";

export async function bootstrapApp() {
  await ensureSignedInUser();
  await registerForPushNotificationsAsync();
}
