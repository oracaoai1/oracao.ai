import { notFound } from "next/navigation";
import { getCharacter, characters } from "@/lib/characters";
import ChatRoom from "./ChatRoom";

export function generateStaticParams() {
  return characters.map((c) => ({ id: c.id }));
}

export function generateMetadata({ params }) {
  const character = getCharacter(params.id);
  if (!character) return { title: "Personagem não encontrado" };
  return {
    title: `Conversar com ${character.name}`,
    description: character.short,
  };
}

export default function ChatPage({ params }) {
  const character = getCharacter(params.id);
  if (!character) notFound();
  return <ChatRoom character={character} />;
}
