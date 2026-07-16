import { TopBar, Footer } from "../components/SiteChrome";
import OracaoDoDiaClient from "./OracaoDoDiaClient";

export const metadata = {
  title: "Reza Diária",
  description:
    "Um santo em destaque a cada dia, com sua sequência de dias seguidos rezando.",
};

export default function OracaoDoDiaPage() {
  return (
    <>
      <TopBar />
      <section className="section">
        <div className="container" style={{ maxWidth: 560 }}>
          <OracaoDoDiaClient />
        </div>
      </section>
      <Footer />
    </>
  );
}
