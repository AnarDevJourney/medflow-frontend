import { CheckCircleFilled, MinusCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { passwordProblems } from "@utils/password";
import styles from "./PasswordRules.module.css";

// Live checklist under a new-password field
export function PasswordRules({ value }: { value: string }) {
  const { t } = useTranslation();
  const problems = passwordProblems(value);
  const rules = ["length", "letter", "digit"] as const;
  return (
    <ul className={styles.rules} aria-live="polite">
      {rules.map((rule) => {
        const ok = value.length > 0 && !problems.includes(rule);
        return (
          <li key={rule} className={ok ? styles.ok : undefined}>
            {ok ? <CheckCircleFilled /> : <MinusCircleOutlined />}
            {t(`auth.passwordRule.${rule}`)}
          </li>
        );
      })}
    </ul>
  );
}
