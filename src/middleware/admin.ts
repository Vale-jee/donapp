import type { NextApiRequest } from "next";

import { requireAuth, requireRole, type AuthContext } from "./auth";

export async function requireAdmin(request: NextApiRequest): Promise<AuthContext> {
  const auth = await requireAuth(request);
  requireRole(auth, ["ADMIN"]);
  return auth;
}
