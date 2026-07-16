"use client";

// Menu hamburguer para telas estreitas — abaixo de 720px tanto o `.nav`
// quanto o `.auth-nav` do cabeçalho ficam ocultos (ver globals.css: nomes
// longos quebravam linha e disputavam espaço com o botão), então este é o
// único jeito de alcançar essas ações no celular.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/oracao-do-dia", label: "Reza Diária" },
  { href: "/#personagens", label: "Personagens" },
  { href: "/biblioteca-catolica", label: "Biblioteca" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/sobre", label: "Sobre" },
];

export default function MobileNav() {
  const router = useRouter();
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    setOpen(false);
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  const nome =
    user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Conta";

  return (
    <div className="mobile-nav">
      <button
        type="button"
        className="mobile-nav-toggle"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <>
          <div className="mobile-nav-backdrop" onClick={() => setOpen(false)} />
          <nav className="mobile-nav-panel">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/intencoes" onClick={() => setOpen(false)}>
                  Intenções
                </Link>
                <Link href="/conta" onClick={() => setOpen(false)}>
                  Olá, {nome}
                </Link>
                <button type="button" className="mobile-nav-signout" onClick={signOut}>
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link href="/entrar" onClick={() => setOpen(false)}>
                  Entrar
                </Link>
                <Link href="/cadastro" onClick={() => setOpen(false)}>
                  Criar conta
                </Link>
              </>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
