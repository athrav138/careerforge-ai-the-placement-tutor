import { NextResponse } from "next/server";

// Managed Neon Auth handles OAuth callbacks through the auth API route.
// This legacy callback remains only as a safe redirect for old bookmarks.
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
