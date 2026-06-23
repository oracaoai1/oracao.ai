"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Mostra o estado de autenticação na barra superior. É um Client Component
// (lê a sessão no navegador) justamente para NÃO tornar dinâmicas as páginas
// estáticas/SSG, como /chat/[id].
export default function AuthNav() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setUser(data.user ?? null);
        setReady(true);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  // Evita "piscar" o botão errado antes de sabermos o estado.
  if (!ready) return <span className="auth-nav" aria-hidden style={{ minWidth: 64 }} />;

  if (!user) {
    return (
      <div className="auth-nav">
        <Link href="/entrar">Entrar</Link>
        <Link href="/cadastro" className="pill">
          Criar conta
        </Link>
      </div>
    );
  }

  const nome =
    user.user_metadata?.display_name || user.email?.split("@")[0] || "Conta";

  return (
    <div className="auth-nav">
      <span className="who">Olá, {nome}</span>
      <button className="link-btn" onClick={signOut}>
        Sair
      </button>
    </div>
  );
}
