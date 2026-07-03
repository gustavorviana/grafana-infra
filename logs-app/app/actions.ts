"use server";

import { headers } from "next/headers";

import { applicationRepository } from "@/lib/repositories/application-repository";
import { loginAttemptRepository } from "@/lib/repositories/login-attempt-repository";
import { logTokenRepository } from "@/lib/repositories/log-token-repository";
import {
  UsernameTakenError,
  userRepository,
} from "@/lib/repositories/user-repository";
import { validatePassword } from "@/lib/password";
import * as session from "@/lib/session";
import type { Application, LoginAttempt, LogToken, PublicUser, User } from "@/lib/types";

// Result shape for user mutations that can fail validation.
export type UsersResult = { users: PublicUser[]; error: string | null };

// --- Auth ---
export async function login(
  username: string,
  password: string
): Promise<{ ok: boolean; blocked?: boolean }> {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";

  if (loginAttemptRepository.isBlocked(ip)) {
    return { ok: false, blocked: true };
  }

  const ok = await session.login(username, password);
  if (ok) {
    loginAttemptRepository.resetAttempts(ip);
    return { ok: true };
  }

  loginAttemptRepository.recordFailure(ip);
  return { ok: false };
}
export async function logout(): Promise<void> {
  await session.logout();
}

// Every mutation returns the fresh collection so the client can render it
// without ever holding data logic of its own.

// --- Users ---
export async function listUsers(): Promise<PublicUser[]> {
  return userRepository.list();
}
export async function createUser(
  data: Omit<User, "id">
): Promise<UsersResult> {
  const check = validatePassword(data.password, data.username);
  if (!check.ok) return { users: userRepository.list(), error: check.error };
  try {
    userRepository.add(data);
  } catch (e) {
    if (e instanceof UsernameTakenError) {
      return { users: userRepository.list(), error: "Usuário já existe." };
    }
    throw e;
  }
  return { users: userRepository.list(), error: null };
}
export async function updateUser(
  id: string,
  patch: Partial<Omit<User, "id">>
): Promise<UsersResult> {
  if (patch.password !== undefined) {
    const check = validatePassword(patch.password, patch.username);
    if (!check.ok) return { users: userRepository.list(), error: check.error };
  }
  try {
    userRepository.edit(id, patch);
  } catch (e) {
    if (e instanceof UsernameTakenError) {
      return { users: userRepository.list(), error: "Usuário já existe." };
    }
    throw e;
  }
  return { users: userRepository.list(), error: null };
}
export async function deleteUser(id: string): Promise<PublicUser[]> {
  userRepository.remove(id);
  return userRepository.list();
}

// --- Applications ---
export async function listApplications(): Promise<Application[]> {
  return applicationRepository.list();
}
export async function createApplication(
  data: Omit<Application, "id">
): Promise<Application[]> {
  applicationRepository.add(data);
  return applicationRepository.list();
}
export async function updateApplication(
  id: string,
  patch: Partial<Omit<Application, "id">>
): Promise<Application[]> {
  applicationRepository.edit(id, patch);
  return applicationRepository.list();
}
export async function deleteApplication(id: string): Promise<Application[]> {
  applicationRepository.remove(id);
  return applicationRepository.list();
}

// --- Log Tokens ---
export async function listTokens(): Promise<LogToken[]> {
  return logTokenRepository.list();
}
export async function createToken(
  data: Omit<LogToken, "id" | "token">
): Promise<{ created: LogToken; tokens: LogToken[] }> {
  const created = logTokenRepository.add(data);
  return { created, tokens: logTokenRepository.list() };
}
export async function updateToken(
  id: string,
  patch: Partial<Omit<LogToken, "id" | "token">>
): Promise<LogToken[]> {
  logTokenRepository.edit(id, patch);
  return logTokenRepository.list();
}
export async function resetToken(
  id: string
): Promise<{ token: string; tokens: LogToken[] }> {
  const token = logTokenRepository.reset(id);
  return { token, tokens: logTokenRepository.list() };
}
export async function deleteToken(id: string): Promise<LogToken[]> {
  logTokenRepository.remove(id);
  return logTokenRepository.list();
}

// --- Blocked IPs ---
export async function listBlockedIps(): Promise<LoginAttempt[]> {
  return loginAttemptRepository.listBlocked();
}

export async function unblockIp(ip: string): Promise<LoginAttempt[]> {
  loginAttemptRepository.unblock(ip);
  return loginAttemptRepository.listBlocked();
}
