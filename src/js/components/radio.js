
let radioId = 0;

export function Radio(label, obj, prop, text, value, disabled) {
	return {
		$template: "#radio",
		id: "rdo" + radioId++,
		text,
		value,
		label,
		checked: i => obj[prop] == value[i],
		set: i => obj[prop] = value[i],
		disabled: () => disabled?.(),
	};
}