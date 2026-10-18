import { NextRequest } from "next/server";
import { getNeonAuth } from "@/lib/auth-server";

export async function proxy(request: NextRequest) {
  return getNeonAuth().middleware({ loginUrl: "/login" })(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding"],
};
