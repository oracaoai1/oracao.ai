// Atualiza a sessão do Supabase a cada requisição, repassando os cookies
// renovados tanto para a resposta quanto para o servidor. Chamado pelo
// middleware raiz (middleware.js).
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function updateSession(request) {
  let response = NextResponse.next({ request });

  // Sem credenciais configuradas, não há sessão a atualizar (ex.: antes de
  // criar o projeto no Supabase). Evita quebrar o app localmente.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: não execute código entre criar o cliente e getUser().
  // Renova o token de acesso quando necessário.
  await supabase.auth.getUser();

  return response;
}
