import type { ReactNode } from "react";
import styles from "./DetailPage.module.css";

export interface HeroFact {
  key: string;
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "success" | "warning" | "muted";
}

// The strip of key facts under a detail page's hero
export function HeroFacts({ facts }: { facts: HeroFact[] }) {
  if (facts.length === 0) return null;
  return (
    <dl className={styles.facts}>
      {facts.map((fact) => (
        <div key={fact.key} className={styles.fact}>
          <dt>
            <span className={styles.factIcon} aria-hidden="true">
              {fact.icon}
            </span>
            {fact.label}
          </dt>
          <dd>
            <span className={styles.factValue} data-tone={fact.tone}>
              {fact.value}
            </span>
            {fact.sub && <span className={styles.factSub}>{fact.sub}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
