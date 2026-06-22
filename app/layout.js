import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://www.oracao.ai"),
  title: {
    default: "Oração.AI — Converse com as figuras históricas da Igreja",
    template: "%s · Oração.AI",
  },
  description:
    "Plataforma de personagens de inteligência artificial que recriam santos, papas e doutores da Igreja Católica para conversas educativas e espirituais.",
  openGraph: {
    title: "Oração.AI",
    description:
      "Converse com santos, papas e doutores da Igreja Católica recriados por inteligência artificial.",
    url: "https://www.oracao.ai",
    siteName: "Oração.AI",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
