import bcrypt from "bcryptjs";

// Password policy — follows NIST SP 800-63B Rev.4 (Jul 2025):
// length-first, no arbitrary composition rules, screen common/breached values.
// https://pages.nist.gov/800-63-4/sp800-63b.html
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

// Small built-in blocklist (a real deployment would screen a breach corpus).
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "123456",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty",
  "qwerty123",
  "111111",
  "000000",
  "iloveyou",
  "admin",
  "admin123",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "abc123",
]);

export type PasswordCheck = { ok: true } | { ok: false; error: string };

export function validatePassword(
  password: string,
  username?: string
): PasswordCheck {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      error: `A senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres.`,
    };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      ok: false,
      error: `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
    };
  }
  if (/^\s|\s$/.test(password)) {
    return {
      ok: false,
      error: "A senha não pode começar ou terminar com espaço.",
    };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, error: "Esta senha é muito comum. Escolha outra." };
  }
  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    return { ok: false, error: "A senha não pode conter o nome de usuário." };
  }
  return { ok: true };
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
