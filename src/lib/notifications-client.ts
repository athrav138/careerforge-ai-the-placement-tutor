type Requester = typeof fetch;

export async function markNotificationAsRead(
  id: string,
  requester: Requester = fetch,
): Promise<void> {
  const response = await requester(`/api/notifications/${encodeURIComponent(id)}`, {
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error("Unable to mark notification as read.");
  }
}

export async function markAllNotificationsAsRead(
  requester: Requester = fetch,
): Promise<void> {
  const response = await requester("/api/notifications/read-all", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Unable to mark notifications as read.");
  }
}
