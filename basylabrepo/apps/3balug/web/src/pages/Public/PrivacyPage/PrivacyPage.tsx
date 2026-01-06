import * as styles from "./PrivacyPage.css";

export function PrivacyPage() {
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Política de Privacidade</h1>
          <p className={styles.lastUpdated}>
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Introdução</h2>
            <p className={styles.paragraph}>
              Esta Política de Privacidade descreve como o 3Balug coleta, usa, armazena e protege as
              informações pessoais dos usuários de nossa plataforma. Ao utilizar nossos serviços,
              você concorda com as práticas descritas nesta política.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Informações Coletadas</h2>
            <p className={styles.paragraph}>Coletamos os seguintes tipos de informações:</p>
            <ul className={styles.list}>
              <li>
                <strong>Informações de Cadastro:</strong> Nome, e-mail, telefone e outras
                informações fornecidas no registro
              </li>
              <li>
                <strong>Informações de Uso:</strong> Dados sobre como você utiliza nossa plataforma,
                incluindo páginas visitadas e ações realizadas
              </li>
              <li>
                <strong>Informações de Pagamento:</strong> Dados necessários para processar
                pagamentos (processados por parceiros seguros)
              </li>
              <li>
                <strong>Dados Técnicos:</strong> Endereço IP, tipo de navegador, sistema operacional
                e outras informações técnicas
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Como Usamos suas Informações</h2>
            <p className={styles.paragraph}>Utilizamos suas informações para:</p>
            <ul className={styles.list}>
              <li>Fornecer, manter e melhorar nossos serviços</li>
              <li>Processar transações e enviar confirmações</li>
              <li>Enviar comunicações relacionadas ao serviço</li>
              <li>Personalizar sua experiência na plataforma</li>
              <li>Detectar, prevenir e resolver problemas técnicos</li>
              <li>Cumprir obrigações legais e regulatórias</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Compartilhamento de Informações</h2>
            <p className={styles.paragraph}>
              Não vendemos suas informações pessoais. Podemos compartilhar suas informações apenas
              nas seguintes circunstâncias:
            </p>
            <ul className={styles.list}>
              <li>
                <strong>Prestadores de Serviços:</strong> Com empresas que nos auxiliam na operação
                da plataforma (processamento de pagamentos, hospedagem, etc.)
              </li>
              <li>
                <strong>Conformidade Legal:</strong> Quando exigido por lei ou para proteger nossos
                direitos
              </li>
              <li>
                <strong>Transferências Empresariais:</strong> Em caso de fusão, aquisição ou venda
                de ativos
              </li>
              <li>
                <strong>Com seu Consentimento:</strong> Quando você autorizar explicitamente
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Segurança dos Dados</h2>
            <p className={styles.paragraph}>
              Implementamos medidas de segurança técnicas e organizacionais apropriadas para
              proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação
              ou destruição. Isso inclui:
            </p>
            <ul className={styles.list}>
              <li>Criptografia de dados em trânsito e em repouso</li>
              <li>Controles de acesso rigorosos</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares</li>
              <li>Auditorias de segurança periódicas</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Seus Direitos</h2>
            <p className={styles.paragraph}>
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
            </p>
            <ul className={styles.list}>
              <li>Acessar suas informações pessoais</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Revogar consentimento para uso de dados</li>
              <li>Solicitar portabilidade de dados</li>
              <li>Obter informações sobre compartilhamento de dados</li>
            </ul>
            <p className={styles.paragraph}>
              Para exercer qualquer um desses direitos, entre em contato conosco através do email:
              privacidade@3balug.com.br
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>7. Cookies e Tecnologias Semelhantes</h2>
            <p className={styles.paragraph}>
              Utilizamos cookies e tecnologias semelhantes para melhorar a experiência do usuário,
              analisar tendências e administrar a plataforma. Você pode configurar seu navegador
              para recusar cookies, mas isso pode afetar a funcionalidade da plataforma.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>8. Retenção de Dados</h2>
            <p className={styles.paragraph}>
              Mantemos suas informações pessoais pelo tempo necessário para cumprir os propósitos
              descritos nesta política, a menos que um período de retenção mais longo seja exigido
              ou permitido por lei.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>9. Transferência Internacional de Dados</h2>
            <p className={styles.paragraph}>
              Seus dados podem ser transferidos e armazenados em servidores localizados fora do
              Brasil. Quando isso ocorrer, garantimos que medidas adequadas de proteção sejam
              implementadas.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>10. Menores de Idade</h2>
            <p className={styles.paragraph}>
              Nossos serviços não são direcionados a menores de 18 anos. Não coletamos
              intencionalmente informações de menores. Se tomarmos conhecimento de que coletamos
              dados de um menor, tomaremos medidas para excluir essas informações.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>11. Alterações nesta Política</h2>
            <p className={styles.paragraph}>
              Podemos atualizar esta Política de Privacidade periodicamente. A versão mais recente
              estará sempre disponível em nossa plataforma. Notificaremos você sobre alterações
              significativas por email ou através de um aviso em nossa plataforma.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>12. Contato</h2>
            <p className={styles.paragraph}>
              Para questões sobre esta Política de Privacidade ou sobre como tratamos seus dados
              pessoais, entre em contato:
            </p>
            <ul className={styles.list}>
              <li>Email: privacidade@3balug.com.br</li>
              <li>Email geral: contato@3balug.com.br</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>13. Conformidade com a LGPD</h2>
            <p className={styles.paragraph}>
              Esta política está em conformidade com a Lei Geral de Proteção de Dados (Lei nº
              13.709/2018). Para mais informações sobre a LGPD, visite o site da Autoridade Nacional
              de Proteção de Dados (ANPD).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
