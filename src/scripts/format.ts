const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	timeZone: 'UTC',
});

export const formatDate = (date: Date) => dateFormatter.format(date);

/** Tempo de leitura estimado (≈ 200 palavras por minuto). */
export const readingTime = (text = '') => Math.max(1, Math.round(text.trim().split(/\s+/).length / 200));
