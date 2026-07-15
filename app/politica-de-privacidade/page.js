import Link from "next/link";
import { TopBar, Footer } from "../components/SiteChrome";

export const metadata = {
  title: "Política de Privacidade",
  description:
    "Como o Oração.AI coleta, usa e protege dados pessoais, em conformidade com a LGPD (Lei nº 13.709/2018).",
};

export default function PoliticaDePrivacidadePage() {
  return (
    <>
      <TopBar />
      <section className="section">
        <div className="container legal-page" style={{ maxWidth: 780 }}>
          <h1>Política de Privacidade</h1>
          <p className="legal-meta">Última atualização: 15 de julho de 2026.</p>

          <div className="legal-notice">
            <strong>Rascunho de referência.</strong> Este texto foi elaborado
            com base no funcionamento real da plataforma na data acima, para
            uso como ponto de partida. Antes de publicar, recomenda-se revisão
            por um profissional jurídico, especialmente quanto aos dados do
            controlador (ainda como placeholder abaixo) e à adequação a
            eventuais mudanças no produto.
          </div>

          <p>
            Esta Política de Privacidade descreve como o{" "}
            <strong>Oração.AI</strong> ("nós", "plataforma") coleta, usa,
            compartilha e protege dados pessoais de quem visita ou usa o site{" "}
            <strong>www.oracao.ai</strong>, em conformidade com a Lei Geral de
            Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018).
          </p>

          <h2>1. Quem é o controlador dos dados</h2>
          <p>
            O controlador dos dados pessoais tratados nesta plataforma é{" "}
            <strong>[NOME COMPLETO OU RAZÃO SOCIAL]</strong>, inscrito(a) no{" "}
            <strong>[CPF OU CNPJ]</strong>, doravante "Oração.AI". Para
            qualquer assunto relacionado a dados pessoais, entre em contato
            pelo e-mail{" "}
            <a href="mailto:oracao@oracao.ai">oracao@oracao.ai</a>.
          </p>

          <h2>2. Quais dados coletamos</h2>
          <h3>2.1 Dados de conta</h3>
          <ul>
            <li>
              <strong>E-mail e senha</strong>, para criar e autenticar sua
              conta (a senha é armazenada de forma criptografada pelo nosso
              provedor de autenticação, nunca em texto simples).
            </li>
            <li>
              <strong>Nome de exibição</strong> (opcional), informado por você
              no cadastro ou em "Minha conta".
            </li>
          </ul>
          <h3>2.2 Dados de uso da plataforma</h3>
          <ul>
            <li>
              <strong>Conversas com os personagens</strong> (suas mensagens e
              as respostas geradas), para manter seu histórico de chat
              disponível entre sessões.
            </li>
            <li>
              <strong>Intenções de oração</strong> que você registrar,
              incluindo o texto livre que escrever — que pode, por sua própria
              iniciativa, conter dados sensíveis (por exemplo, sobre saúde de
              você ou de terceiros). Evite incluir dados sensíveis de outras
              pessoas sem o consentimento delas.
            </li>
            <li>
              <strong>Favoritos</strong> (personagens que você marcar).
            </li>
            <li>
              <strong>Imagens devocionais geradas</strong> a partir das
              respostas dos personagens, quando você solicitar essa geração.
            </li>
          </ul>
          <h3>2.3 Dados de pagamento</h3>
          <p>
            Ao assinar um plano ou comprar um pacote avulso, coletamos{" "}
            <strong>nome, e-mail e CPF/CNPJ</strong> para processar o
            pagamento. Esses dados são enviados diretamente ao nosso
            processador de pagamentos (Asaas) e <strong>não ficam
            armazenados</strong> nos nossos servidores — apenas o identificador
            da assinatura e seu status (ativa, pendente, cancelada) são
            guardados para controle de acesso aos recursos pagos. Dados de
            cartão de crédito não passam pelo Oração.AI em nenhum momento; o
            checkout é feito diretamente na página do Asaas.
          </p>
          <h3>2.4 Dados técnicos</h3>
          <p>
            Nosso provedor de hospedagem (Vercel) processa automaticamente
            informações técnicas de cada requisição (endereço IP, tipo de
            navegador, páginas acessadas) para fins de operação, segurança e
            diagnóstico — não usamos essas informações para publicidade nem as
            compartilhamos com terceiros para esse fim.
          </p>

          <h2>3. Como usamos os dados</h2>
          <ul>
            <li>Criar e manter sua conta e autenticar seu acesso.</li>
            <li>
              Gerar as respostas dos personagens de IA, seu áudio (narração) e
              imagens devocionais associadas.
            </li>
            <li>
              Processar assinaturas e pacotes avulsos, e liberar os recursos
              correspondentes.
            </li>
            <li>Salvar seu histórico de conversas, favoritos e intenções de oração para que você os encontre depois.</li>
            <li>
              Diagnosticar problemas técnicos e melhorar a estabilidade da
              plataforma.
            </li>
            <li>Cumprir obrigações legais e responder a solicitações de autoridades competentes.</li>
          </ul>
          <p>
            Não usamos seus dados para treinar modelos de inteligência
            artificial de terceiros, nem os vendemos a anunciantes.
          </p>

          <h2>4. Com quem compartilhamos dados</h2>
          <p>
            Para funcionar, a plataforma depende de prestadores de serviço
            (operadores, nos termos da LGPD) que processam parte dos dados em
            nosso nome:
          </p>
          <table>
            <thead>
              <tr>
                <th>Serviço</th>
                <th>Finalidade</th>
                <th>Dado envolvido</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Supabase</td>
                <td>Autenticação, banco de dados e armazenamento de arquivos</td>
                <td>Conta, conversas, favoritos, intenções, imagens/áudios gerados</td>
              </tr>
              <tr>
                <td>Anthropic (Claude)</td>
                <td>Geração das respostas dos personagens de IA</td>
                <td>Texto das mensagens da conversa</td>
              </tr>
              <tr>
                <td>ElevenLabs</td>
                <td>Conversão de texto em áudio (narração)</td>
                <td>Texto da resposta do personagem</td>
              </tr>
              <tr>
                <td>fal.ai</td>
                <td>Geração de imagens devocionais</td>
                <td>Trecho da resposta do personagem usado como base da imagem</td>
              </tr>
              <tr>
                <td>Asaas</td>
                <td>Processamento de pagamentos e assinaturas</td>
                <td>Nome, e-mail, CPF/CNPJ</td>
              </tr>
              <tr>
                <td>Vercel</td>
                <td>Hospedagem da aplicação</td>
                <td>Dados técnicos de requisição (IP, navegador)</td>
              </tr>
            </tbody>
          </table>
          <p>
            Alguns desses serviços podem processar dados em servidores fora do
            Brasil (transferência internacional de dados), sempre sob contrato
            e com salvaguardas apropriadas, conforme permitido pelo art. 33 da
            LGPD.
          </p>

          <h2>5. Retenção e exclusão de dados</h2>
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa. Você pode
            excluir sua conta a qualquer momento em{" "}
            <Link href="/conta">Minha conta</Link>; a exclusão remove em
            cascata seus dados de conversas, favoritos, intenções de oração e
            assinatura. Registros de pagamento podem ser retidos pelo Asaas
            pelo prazo exigido pela legislação fiscal, independentemente da
            exclusão da sua conta no Oração.AI.
          </p>

          <h2>6. Seus direitos como titular de dados</h2>
          <p>
            Nos termos do art. 18 da LGPD, você pode solicitar, a qualquer
            momento, mediante contato em{" "}
            <a href="mailto:oracao@oracao.ai">oracao@oracao.ai</a>:
          </p>
          <ul>
            <li>Confirmação de que tratamos seus dados e acesso a eles.</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei.</li>
            <li>Portabilidade dos seus dados a outro fornecedor de serviço.</li>
            <li>Eliminação dos dados tratados com o seu consentimento (ressalvadas hipóteses legais de retenção).</li>
            <li>Informação sobre com quem compartilhamos seus dados.</li>
            <li>Revogação do consentimento, quando aplicável.</li>
          </ul>

          <h2>7. Cookies e armazenamento local</h2>
          <p>
            Usamos cookies estritamente necessários para manter sua sessão de
            login. Também guardamos, no seu navegador (localStorage), uma
            preferência local de auto-narração de áudio — essa informação não
            sai do seu dispositivo. Não usamos cookies de rastreamento
            publicitário nem ferramentas de analytics de terceiros.
          </p>

          <h2>8. Menores de idade</h2>
          <p>
            O Oração.AI não é direcionado a menores de 18 anos. Se você é
            responsável legal por um menor e acredita que ele forneceu dados
            pessoais à plataforma, entre em contato para que possamos avaliar
            a exclusão.
          </p>

          <h2>9. Segurança</h2>
          <p>
            Adotamos medidas técnicas e administrativas para proteger seus
            dados, incluindo controle de acesso por linha (Row Level Security)
            no banco de dados — que restringe cada usuário à leitura e escrita
            apenas dos próprios dados — e conexões criptografadas (HTTPS) em
            toda a plataforma.
          </p>

          <h2>10. Alterações nesta política</h2>
          <p>
            Podemos atualizar esta política periodicamente para refletir
            mudanças na plataforma ou na legislação. A data no topo desta
            página indica a versão mais recente.
          </p>

          <h2>11. Contato</h2>
          <p>
            Dúvidas, solicitações ou reclamações sobre privacidade e proteção
            de dados: <a href="mailto:oracao@oracao.ai">oracao@oracao.ai</a>.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
