// Verifica se o usuário logado é um administrador (por e-mail).
// Lista de e-mails autorizados em ADMIN_EMAILS (separados por vírgula).
import { createClient } from "@/lib/supabase/server";

export async function getAdminUser() {
  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!allow.length) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !allow.includes((user.email || "").toLowerCase())) return null;
  return user;
}
