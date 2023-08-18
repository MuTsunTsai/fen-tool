import { state, store } from "../store";

let checkboxId = 0;

export function CheckboxBase(checked, label, onchange, disabled) {
	return {
		$template: "#checkbox",
		id: "chk" + checkboxId++,
		label,
		checked,
		disabled: () => disabled?.(),
		change: event => {
			if(onchange) onchange(event.target.checked);
		},
	};
}

export function Checkbox(key, label, onchange, disabled) {
	const path = key.split(".");
	let target = key.startsWith("state.") ? state : store;
	if(target == state) path.shift();
	key = path.pop();
	while(path.length) target = target[path.shift()];
	return CheckboxBase(() => target[key], label, v => {
		target[key] = v;
		if(onchange) onchange();
	}, disabled);
}

export function CheckboxR(key, label) {
	return Checkbox(key, label, null, () => state.play.mode == 'retro');
}