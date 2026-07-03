export type User = {
  id: string;
  username: string;
  password: string;
};

// User without the password — the shape exposed to the client.
export type PublicUser = Omit<User, "password">;

export type Application = {
  id: string;
  name: string;
  description: string;
  tag: string;
};

export type LoginAttempt = {
  ip: string;
  attempts: number;
  blocked: boolean;
  blockedAt: number | null;
};

export type LogToken = {
  id: string;
  description: string;
  cliente?: string | null;
  applicationId: string;
  token: string;
};
