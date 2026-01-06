import { Accordion } from "@/components/Accordion/Accordion";
import { faqs } from "../../data/faqs";
import * as styles from "../../styles.css";

export function FAQSection() {
  return (
    <section id="faq" className={styles.faqSection} aria-labelledby="faq-heading">
      <div className={styles.container}>
        <header className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>FAQ</span>
          <h2 id="faq-heading" className={styles.sectionTitle}>
            Perguntas Frequentes
          </h2>
          <p className={styles.sectionDescription}>
            Tire suas dúvidas sobre nossa plataforma e planos.
          </p>
        </header>

        <Accordion.Root type="single" variant="default" className={styles.faqGrid}>
          {faqs.map((faq) => (
            <Accordion.Item key={faq.question} value={faq.question}>
              <Accordion.Trigger title={faq.question} />
              <Accordion.Content>{faq.answer}</Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
