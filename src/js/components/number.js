
export function NumInput(title, obj, prop, min, max) {
	const get = () => obj[prop];
	return {
		$template: "#number",
		title,
		get,
		set: event => {
			const el = event.target;
			const oldV = get();
			const newV = Math.round(Number(el.value));
			if(isNaN(newV) || newV < min || newV > max) {
				el.value = oldV;
			} else {
				obj[prop] = newV;
			}
		},
		setBy: v => obj[prop] += v,
		isMin: () => get() <= min,
		isMax: () => get() >= max,
	};
}