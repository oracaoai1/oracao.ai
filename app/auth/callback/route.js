import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Destino do link de confirmação de e-mail (e de logins OAuth, no futuro).
// Troca o "code" recebido por uma sessão gravada nos cookies.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Falha ou link sem código: manda para o login com um aviso.
  return NextResponse.redirect(`${origin}/entrar?erro=confirmacao`);
}
