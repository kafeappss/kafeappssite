let counter = 0;

/** Gera ids únicos durante a renderização (para gradientes de SVG, campos etc.). */
export const uid = (prefix: string) => `${prefix}-${++counter}`;
