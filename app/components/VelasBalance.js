"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Saldo de Velas do usuário na barra superior. Só aparece logado.
export default function VelasBalance() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(null);

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

  useEffect(() => {
    if (!user) {
      setBalance(null);
      return;
    }
    let active = true;
    fetch("/api/velas")
      .then((r) => r.json())
      .then((d) => active && setBalance(d.balance ?? 0))
      .catch(() => active && setBalance(0));
    return () => {
      active = false;
    };
  }, [user]);

  if (!user || balance === null) return null;

  return (
    <Link href="/assinar" className="velas-balance" title="Comprar mais Velas">
      🕯️ {balance}
    </Link>
  );
}
