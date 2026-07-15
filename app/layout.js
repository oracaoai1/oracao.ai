import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://www.oracao.ai"),
  icons: {
    icon: [
      { url: "/oracao-icon.png", sizes: "512x512", type: "image/png" },
      { url: "/oracao-icon.png", sizes: "192x192", type: "image/png" },
      { url: "/oracao-icon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/oracao-icon.png", sizes: "512x512", type: "image/png" }],
    shortcut: "/oracao-icon.png",
  },
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
  verification: {
      other: {
            "msvalidate.01": "7A7D5CF8861E224E2B2D3CA2CE38C1AF",
      },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

