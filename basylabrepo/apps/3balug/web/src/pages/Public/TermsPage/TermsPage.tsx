import { useNavigate } from "react-router-dom";
import * as styles from "./TermsPage.css";

export function TermsPage() {
  const navigate = useNavigate();
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Termos de Uso</h1>
          <p className={styles.lastUpdated}>
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Aceitação dos Termos</h2>
            <p className={styles.paragraph}>
              Ao acessar e usar a plataforma 3Balug, você concorda em cumprir e estar vinculado aos
              seguintes termos e condições de uso. Se você não concordar com qualquer parte destes
              termos, não deverá usar nossa plataforma.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Descrição do Serviço</h2>
            <p className={styles.paragraph}>
              O 3Balug é uma plataforma de gestão imobiliária que oferece ferramentas para
              gerenciamento de imóveis, clientes, contratos e processos relacionados ao mercado
              imobiliário.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Cadastro e Conta</h2>
            <p className={styles.paragraph}>
              Para utilizar nossos serviços, você deve criar uma conta fornecendo informações
              verdadeiras, completas e atualizadas. Você é responsável por manter a
              confidencialidade de suas credenciais de acesso e por todas as atividades que ocorrem
              em sua conta.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Planos e Pagamentos</h2>
            <p className={styles.paragraph}>
              O acesso aos serviços está condicionado à contratação de um dos planos oferecidos. Os
              pagamentos devem ser realizados de acordo com o plano escolhido. O não pagamento pode
              resultar na suspensão ou cancelamento do acesso aos serviços.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Uso Aceitável</h2>
            <p className={styles.paragraph}>Você concorda em não:</p>
            <ul className={styles.list}>
              <li>Usar a plataforma para qualquer finalidade ilegal</li>
              <li>Tentar obter acesso não autorizado a qualquer parte da plataforma</li>
              <li>Interferir ou interromper o funcionamento da plataforma</li>
              <li>Transmitir vírus, malware ou qualquer código prejudicial</li>
              <li>Violar direitos de propriedade intelectual de terceiros</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Propriedade Intelectual</h2>
            <p className={styles.paragraph}>
              Todo o conteúdo da plataforma, incluindo mas não se limitando a textos, gráficos,
              logos, ícones e software, é propriedade do CRM Imobiliário e está protegido por leis
              de direitos autorais e outras leis de propriedade intelectual.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>7. Privacidade</h2>
            <p className={styles.paragraph}>
              O uso de suas informações pessoais é regido por nossa{" "}
              <button type="button" className={styles.link} onClick={() => navigate("/privacy")}>
                Política de Privacidade
              </button>
              .
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>8. Limitação de Responsabilidade</h2>
            <p className={styles.paragraph}>
              O 3Balug não se responsabiliza por quaisquer danos diretos, indiretos, incidentais,
              consequenciais ou punitivos decorrentes do uso ou impossibilidade de uso da
              plataforma.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>9. Modificações dos Termos</h2>
            <p className={styles.paragraph}>
              Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações
              entrarão em vigor imediatamente após a publicação na plataforma. O uso contínuo da
              plataforma após modificações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>10. Lei Aplicável</h2>
            <p className={styles.paragraph}>
              Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer
              disputa relacionada a estes termos será resolvida nos tribunais brasileiros
              competentes.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>11. Contato</h2>
            <p className={styles.paragraph}>
              Para quaisquer dúvidas sobre estes Termos de Uso, entre em contato conosco através do
              email: contato@3balug.com.br
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
