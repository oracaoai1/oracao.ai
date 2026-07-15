"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "oracao-cookie-consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {}
  }, []);

  function aceitar() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Aviso de cookies">
      <p>
        Usamos apenas cookies necessários para manter sua sessão de login.
        Não usamos cookies de rastreamento publicitário. Veja nossa{" "}
        <Link href="/politica-de-privacidade">Política de Privacidade</Link>.
      </p>
      <div className="cookie-banner-actions">
        <button type="button" className="btn btn-gold" onClick={aceitar}>
          Entendi
        </button>
      </div>
    </div>
  );
}
