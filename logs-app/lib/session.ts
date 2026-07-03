import { cookies } from "next/headers";

import {
  SESSION_MAX_AGE_MS,
  userRepository,
} from "@/lib/repositories/user-repository";
import { SESSION_COOKIE } from "@/lib/session-constants";
import type { PublicUser } from "@/lib/types";

export { SESSION_COOKIE };

// Validate credentials, issue a session, and set the httpOnly cookie.
export async function login(
  username: string,
  password: string
): Promise<boolean> {
  const token = userRepository.login(username, password);
  if (!token) return false;

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
  });
  return true;
}

export async function logout(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) userRepository.logout(token);
  store.delete(SESSION_COOKIE);
}

// Current user for the request's session cookie, or null.
export async function getCurrentUser(): Promise<PublicUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return userRepository.findBySession(token) ?? null;
}
