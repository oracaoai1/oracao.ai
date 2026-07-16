// GET /api/oracao-do-dia?localDate=YYYY-MM-DD — santo do dia + frase, e (se
// logado) o estado atual do streak de Reza Diária do usuário.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDailyCharacter, getDailyFrase } from "@/lib/dailyPrayer";

const isValidLocalDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");

export async function GET(request) {
  const localDate = new URL(request.url).searchParams.get("localDate");
  if (!isValidLocalDate(localDate)) {
    return NextResponse.json({ error: "localDate inválida." }, { status: 400 });
  }

  const { character, dayOfYear } = getDailyCharacter(localDate);
  const frase = getDailyFrase(character, dayOfYear);
  const santoDoDia = {
    id: character.id,
    name: character.name,
    title: character.title,
    image: character.image,
    frase,
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ santoDoDia, streak: null });
  }

  const [{ data: streakRow }, { data: logRow }] = await Promise.all([
    supabase
      .from("daily_prayer_streak")
      .select("current_streak, longest_streak, freezes_available")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("daily_prayer_log")
      .select("id")
      .eq("user_id", user.id)
      .eq("local_date", localDate)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    santoDoDia,
    streak: {
      currentStreak: streakRow?.current_streak || 0,
      longestStreak: streakRow?.longest_streak || 0,
      freezesAvailable: streakRow?.freezes_available ?? 1,
      completedToday: !!logRow,
    },
  });
}
