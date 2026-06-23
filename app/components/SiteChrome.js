import Link from "next/link";
import AuthNav from "./AuthNav";

export function TopBar() {
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link href="/" className="brand">
          <span className="mark">✝</span>
          <span>
            Oração<span className="dim">.AI</span>
          </span>
        </Link>
        <nav className="nav">
          <Link href="/#personagens">Personagens</Link>
          <Link href="/#como-funciona">Como funciona</Link>
          <Link href="/sobre">Sobre</Link>
        </nav>
        <AuthNav />
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="brand" style={{ color: "var(--parchment)" }}>
            <span className="mark">✝</span>
            <span>
              Oração<span className="dim">.AI</span>
            </span>
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
      </div>
    </footer>
  );
}
