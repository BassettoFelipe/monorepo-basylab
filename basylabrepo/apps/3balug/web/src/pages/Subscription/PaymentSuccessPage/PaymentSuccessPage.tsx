import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button/Button";
import * as styles from "./PaymentSuccessPage.css";

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown <= 0) {
      navigate("/login", { replace: true });
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, navigate]);

  const handleGoToLogin = () => {
    navigate("/login", { replace: true });
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.iconWrapper}>
            <CheckCircle className={styles.icon} />
          </div>

          <div className={styles.header}>
            <h1 className={styles.title}>Pagamento Confirmado!</h1>
            <p className={styles.subtitle}>
              Sua assinatura foi ativada com sucesso. Agora você pode acessar todas as
              funcionalidades do 3Balug.
            </p>
          </div>

          <div className={styles.infoBox}>
            <p className={styles.infoText}>
              Um email de confirmação foi enviado para você com os detalhes da sua assinatura e
              instruções de acesso.
            </p>
          </div>

          <div className={styles.countdown}>
            <p className={styles.countdownText}>
              Redirecionando para o login em{" "}
              <span className={styles.countdownNumber}>{countdown}</span> segundos...
            </p>
          </div>

          <div className={styles.actions}>
            <Button onClick={handleGoToLogin} fullWidth>
              Fazer Login Agora
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
