import Link from "next/link";
import { TopBar, Footer } from "../components/SiteChrome";

export const metadata = {
  title: "Termos de Uso",
  description:
    "Regras de uso da plataforma Oração.AI: cadastro, assinaturas, conduta e limites de responsabilidade.",
};

export default function TermosDeUsoPage() {
  return (
    <>
      <TopBar />
      <section className="section">
        <div className="container legal-page" style={{ maxWidth: 780 }}>
          <h1>Termos de Uso</h1>
          <p className="legal-meta">Última atualização: 15 de julho de 2026.</p>

          <div className="legal-notice">
            <strong>Rascunho de referência.</strong> Este texto foi elaborado
            com base no funcionamento real da plataforma na data acima, para
            uso como ponto de partida. Antes de publicar, recomenda-se revisão
            por um profissional jurídico, especialmente quanto aos dados do
            responsável legal (ainda como placeholder abaixo).
          </div>

          <p>
            Estes Termos de Uso regulam o acesso e uso do site{" "}
            <strong>www.oracao.ai</strong> ("Oração.AI", "plataforma"),
            operado por <strong>[NOME COMPLETO OU RAZÃO SOCIAL]</strong>,
            inscrito(a) no <strong>[CPF OU CNPJ]</strong>. Ao criar uma conta
            ou usar a plataforma, você concorda com estes termos e com a{" "}
            <Link href="/politica-de-privacidade">Política de Privacidade</Link>.
          </p>

          <h2>1. O que é o Oração.AI</h2>
          <p>
            O Oração.AI é uma plataforma de personagens de inteligência
            artificial que recriam figuras da Igreja Católica — santos, papas,
            místicos e doutores — a partir de fontes históricas, escritos e da
            doutrina católica. As conversas, áudios e imagens gerados são{" "}
            <strong>recriações produzidas por inteligência artificial</strong>,
            não a pessoa real, não constituem revelação privada nem
            magistério oficial da Igreja, e podem conter imprecisões. Elas não
            substituem a leitura das Sagradas Escrituras, o Catecismo, os
            sacramentos, nem o acompanhamento de um sacerdote, diretor
            espiritual, profissional de saúde ou advogado — dependendo do
            assunto tratado na conversa.
          </p>

          <h2>2. Cadastro e conta</h2>
          <ul>
            <li>
              Para usar recursos que exigem login (salvar conversas,
              favoritos, intenções de oração, assinaturas), você precisa criar
              uma conta com e-mail e senha válidos.
            </li>
            <li>
              A plataforma é destinada a maiores de 18 anos. Ao se cadastrar,
              você declara ter idade mínima para contratar.
            </li>
            <li>
              Você é responsável por manter sua senha em sigilo e por toda
              atividade realizada na sua conta.
            </li>
            <li>
              Você pode encerrar sua conta a qualquer momento em{" "}
              <Link href="/conta">Minha conta</Link>, o que remove
              permanentemente seus dados de uso (conversas, favoritos,
              intenções de oração) conforme descrito na{" "}
              <Link href="/politica-de-privacidade">
                Política de Privacidade
              </Link>
              .
            </li>
          </ul>

          <h2>3. Uso aceitável</h2>
          <p>Ao usar a plataforma, você concorda em não:</p>
          <ul>
            <li>Usar os personagens para produzir ou disseminar discurso de ódio, difamação, desinformação religiosa deliberada ou conteúdo ilegal.</li>
            <li>Tentar apresentar as respostas geradas como se fossem declarações reais e verificadas da figura histórica representada, revelação divina ou posição oficial da Igreja Católica.</li>
            <li>Tentar contornar limites técnicos da plataforma (ex.: extrair prompts internos, sobrecarregar a API, acessar dados de outros usuários).</li>
            <li>Usar a plataforma para fins comerciais não autorizados, incluindo revenda de acesso.</li>
          </ul>
          <p>
            Reservamo-nos o direito de suspender ou encerrar contas que violem
            estes termos.
          </p>

          <h2>4. Assinaturas, pacotes e pagamentos</h2>
          <ul>
            <li>
              Alguns recursos (mensagens ilimitadas, geração de imagem, cenas
              em vídeo, avatar ao vivo) exigem uma assinatura paga ou o uso de
              "Velas" (créditos avulsos), conforme detalhado na página{" "}
              <Link href="/assinar">Assinar</Link>.
            </li>
            <li>
              Os pagamentos são processados por um parceiro externo (Asaas),
              via Pix, cartão ou boleto. O Oração.AI não armazena dados de
              cartão de crédito.
            </li>
            <li>
              Assinaturas são renovadas automaticamente no ciclo escolhido
              (mensal ou anual) até que sejam canceladas.
            </li>
            <li>
              Conforme o art. 49 do Código de Defesa do Consumidor, você pode
              desistir da contratação em até 7 dias corridos da assinatura,
              com direito a reembolso integral, exceto por Velas já
              consumidas.
            </li>
          </ul>

          <h2>5. Propriedade intelectual</h2>
          <p>
            A marca Oração.AI, o design da plataforma e seu código-fonte
            pertencem ao Oração.AI. Os textos, áudios e imagens gerados pelos
            personagens de IA são disponibilizados para seu uso pessoal e não
            comercial, mediante indicação de que se trata de conteúdo gerado
            por inteligência artificial quando compartilhado publicamente.
          </p>

          <h2>6. Limitação de responsabilidade</h2>
          <p>
            O conteúdo gerado pelos personagens de IA é produzido por modelos
            de linguagem e pode conter erros, imprecisões teológicas ou
            históricas, apesar dos esforços de fidelidade às fontes. O
            Oração.AI não se responsabiliza por decisões tomadas com base
            exclusivamente nas respostas da plataforma, especialmente em
            assuntos de saúde, direito, finanças ou discernimento espiritual
            que exijam acompanhamento profissional ou pastoral qualificado.
          </p>

          <h2>7. Alterações nestes termos</h2>
          <p>
            Podemos atualizar estes Termos de Uso periodicamente. Mudanças
            relevantes serão comunicadas na plataforma. O uso continuado após
            a atualização implica concordância com os novos termos.
          </p>

          <h2>8. Lei aplicável e foro</h2>
          <p>
            Estes termos são regidos pelas leis da República Federativa do
            Brasil. Fica eleito o foro do domicílio do consumidor para dirimir
            eventuais controvérsias, conforme o Código de Defesa do
            Consumidor.
          </p>

          <h2>9. Contato</h2>
          <p>
            Dúvidas sobre estes termos:{" "}
            <a href="mailto:oracao@oracao.ai">oracao@oracao.ai</a>.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
