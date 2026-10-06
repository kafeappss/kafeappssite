/** Luz que acompanha o cursor dentro dos cartões (.card). */
if (window.matchMedia('(pointer: fine)').matches) {
	document.addEventListener(
		'pointermove',
		(event) => {
			const card = (event.target as Element | null)?.closest?.<HTMLElement>('.card');
			if (!card) return;
			const rect = card.getBoundingClientRect();
			card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
			card.style.setProperty('--my', `${event.clientY - rect.top}px`);
		},
		{ passive: true },
	);
}
