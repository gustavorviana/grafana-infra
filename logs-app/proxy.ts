import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { userRepository } from "@/lib/repositories/user-repository";
import { SESSION_COOKIE } from "@/lib/session-constants";

// Runs on the Node.js runtime (Next 16 default), so it can validate the
// session token against SQLite directly.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isValid = !!token && !!userRepository.findBySession(token);

  const isLogin = pathname === "/";

  // Already authenticated on the login screen → go to the main screen.
  if (isLogin) {
    if (isValid) {
      return NextResponse.redirect(new URL("/applications", request.url));
    }
    return NextResponse.next();
  }

  // Any other (non-api) route requires a valid session.
  if (!isValid) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Every path except API routes, Next internals, and static assets.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)",
  ],
};
