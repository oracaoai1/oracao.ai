import { TopBar, Footer } from "../components/SiteChrome";
import AssinarClient from "./AssinarClient";

export const metadata = {
  title: "Assinar Premium",
  description:
    "Assine o Oração.AI Premium: conversas ilimitadas com os santos, áudio das respostas e muito mais.",
};

export default function AssinarPage() {
  return (
    <>
      <TopBar />
      <main className="auth-wrap">
        <div className="auth-card" style={{ maxWidth: 560 }}>
          <h1>Oração.AI Premium</h1>
          <p className="auth-sub">
            Converse sem limites com os santos, ouça as respostas em áudio e
            apoie a missão do Oração.AI.
          </p>
          <AssinarClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
