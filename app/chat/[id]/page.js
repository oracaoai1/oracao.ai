import { notFound } from "next/navigation";
import { getCharacter, characters } from "@/lib/characters";
import ChatRoom from "./ChatRoom";

export function generateStaticParams() {
  return characters.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const character = getCharacter(id);
  if (!character) return { title: "Personagem não encontrado" };
  return {
    title: `Conversar com ${character.name}`,
    description: character.short,
  };
}

export default async function ChatPage({ params }) {
  const { id } = await params;
  const character = getCharacter(id);
  if (!character) notFound();
  return <ChatRoom character={character} />;
}
