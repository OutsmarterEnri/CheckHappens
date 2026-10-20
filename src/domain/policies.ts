/** Assunzioni della variante: vedere docs/REGOLE.md prima di modificarle. */
export const policies = {
  blueRiskMultiplier: { 5: 0.5, 6: 0.5 } as Readonly<Record<number, number>>,
  riskByMove: [0, 0, 0, 0, 0.2, 0.4, 0.6, 0.8, 0.99] as readonly number[],
  riskAfterNinth: 0.99,
} as const;
