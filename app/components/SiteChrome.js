import Link from "next/link";
import MobileNav from "./MobileNav";
import VelasBalance from "./VelasBalance";

export function TopBar() {
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <MobileNav />
        <Link href="/" className="brand brand-logo" aria-label="Oração.AI — início">
          <img src="/logo-oracao.png" alt="Oração.AI" />
        </Link>
        <VelasBalance />
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="brand brand-logo">
            <img src="/logo-oracao.png" alt="Oração.AI" />
          </div>
          <div>
            © {new Date().getFullYear()} Oração.AI — Ad maiorem Dei gloriam
          </div>
        </div>
        <p className="disclaimer">
          As conversas são recriações geradas por inteligência artificial com
          base em fontes históricas e nos escritos das figuras representadas.
          Não substituem o magistério da Igreja, a leitura das Escrituras nem o
          acompanhamento de um sacerdote ou diretor espiritual.
        </p>
        <nav className="footer-links">
          <Link href="/mapa-do-site">Mapa do site</Link>
          <Link href="/termos-de-uso">Termos de Uso</Link>
          <Link href="/politica-de-privacidade">Política de Privacidade</Link>
        </nav>
      </div>
    </footer>
  );
}
