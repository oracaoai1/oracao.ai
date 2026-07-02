# Templates de e-mail do Supabase (PT-BR)

Modelos em português, com o logo e as cores do Oração.AI, para os e-mails de
autenticação do Supabase (que por padrão vêm em inglês).

## Onde colar

No painel do Supabase → **Authentication → Emails → Templates**. Para cada
modelo abaixo: cole o **Subject (assunto)** no campo de assunto e o conteúdo do
arquivo `.html` no campo **Message body (source/HTML)**. Depois clique em **Save**.

| Template no Supabase | Assunto (colar em "Subject") | Arquivo (colar em "Message body") |
| --- | --- | --- |
| **Confirm signup** | `Confirme seu e-mail — Oração.AI` | `confirmation.html` |
| **Reset password** | `Redefina sua senha — Oração.AI` | `recovery.html` |
| **Magic Link** | `Seu link de acesso — Oração.AI` | `magic_link.html` |
| **Invite user** | `Você foi convidado(a) — Oração.AI` | `invite.html` |
| **Change Email Address** | `Confirme seu novo e-mail — Oração.AI` | `email_change.html` |
| **Reauthentication** | `Seu código de verificação — Oração.AI` | `reauthentication.html` |

> Os dois que realmente disparam hoje são **Confirm signup** e **Reset password**.
> Os outros ficam prontos caso venham a ser usados.

## Variáveis do Supabase usadas (não alterar)

- `{{ .ConfirmationURL }}` — link de ação (confirmação, redefinição, etc.)
- `{{ .Token }}` — código numérico (reautenticação)
- `{{ .Email }}` / `{{ .NewEmail }}` — e-mails na troca de endereço

O logo é carregado de `https://www.oracao.ai/logo-oracao.png` (já publicado).

## Dica

Após colar, use o botão de **preview/enviar teste** do Supabase (ou faça um
cadastro real) para conferir que o layout e o link funcionam.
