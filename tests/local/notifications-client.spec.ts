import { expect, test } from "@playwright/test";
import { markAllNotificationsAsRead, markNotificationAsRead } from "@/lib/notifications-client";

test("marking one notification as read uses the API's protected PUT method", async () => {
  let requestUrl = "";
  let requestMethod = "";
  const requester: typeof fetch = async (input, init) => {
    requestUrl = String(input);
    requestMethod = init?.method ?? "GET";
    return new Response(null, { status: 200 });
  };

  await markNotificationAsRead("notification/one", requester);

  expect(requestUrl).toBe("/api/notifications/notification%2Fone");
  expect(requestMethod).toBe("PUT");
});

test("notification state is not marked read when the update fails", async () => {
  const requester: typeof fetch = async () => new Response(null, { status: 503 });

  await expect(markNotificationAsRead("notification-one", requester)).rejects.toThrow(
    "Unable to mark notification as read.",
  );
});

test("marking all notifications as read checks the server response", async () => {
  let requestMethod = "";
  const requester: typeof fetch = async (_input, init) => {
    requestMethod = init?.method ?? "GET";
    return new Response(null, { status: 200 });
  };

  await expect(markAllNotificationsAsRead(requester)).resolves.toBeUndefined();
  expect(requestMethod).toBe("POST");

  await expect(markAllNotificationsAsRead(async () => new Response(null, { status: 503 })))
    .rejects.toThrow("Unable to mark notifications as read.");
});
