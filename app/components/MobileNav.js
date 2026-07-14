"use client";

// Menu hamburguer para telas estreitas — abaixo de 720px o `.nav` do
// cabeçalho fica oculto (ver globals.css), então este é o único jeito de
// alcançar Personagens/Biblioteca/Como funciona/Sobre no celular.
import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/#personagens", label: "Personagens" },
  { href: "/biblioteca-catolica", label: "Biblioteca" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/sobre", label: "Sobre" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

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
          <nav className="mobile-nav-panel" onClick={() => setOpen(false)}>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
