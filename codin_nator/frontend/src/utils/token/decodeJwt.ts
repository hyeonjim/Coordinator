export interface JwtPayload {
  sub?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export function decodeJwt(token: string): JwtPayload {
  const payload = token.split(".")[1];
  if (!payload) {
    throw new Error("Invalid JWT format");
  }

  const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));

  return JSON.parse(decoded);
}
