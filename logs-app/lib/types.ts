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

export type LogToken = {
  id: string;
  description: string;
  applicationId: string;
  token: string;
};
