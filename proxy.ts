import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth-constants";

export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("notice", "session-required");
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*"],
};
