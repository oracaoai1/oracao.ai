// robots.txt dinâmico. Bloqueia rotas privadas/administrativas e de API;
// libera o restante do site para os crawlers.
const BASE_URL = "https://www.oracao.ai";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/conta", "/intencoes", "/auth/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
