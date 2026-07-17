import { notFound } from "next/navigation";
import { getCharacter } from "@/lib/characters";
import { hasLiveAvatar } from "@/lib/liveAvatar";
import { TopBar, Footer } from "@/app/components/SiteChrome";
import AvatarVivoClient from "./AvatarVivoClient";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const character = getCharacter(id);
  return {
    title: character ? `Avatar ao vivo — ${character.name}` : "Avatar ao vivo",
    description: character
      ? `Converse ao vivo, por voz e vídeo, com ${character.name}.`
      : undefined,
  };
}

export default async function AvatarVivoPage({ params }) {
  const { id } = await params;
  const character = getCharacter(id);
  if (!character || !hasLiveAvatar(id)) notFound();

  return (
    <>
      <TopBar />
      <section className="section avatar-vivo-page" style={{ paddingTop: 32 }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <AvatarVivoClient
            character={{
              id: character.id,
              name: character.name,
              title: character.title,
              image: character.image,
              accent: character.accent,
            }}
          />
        </div>
      </section>
      <Footer />
    </>
  );
}
