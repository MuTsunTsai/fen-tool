import { state, store } from "./store";

let checkboxId = 0;

export function CheckboxBase(checked, label, onchange) {
	return {
		$template: "#checkbox",
		id: "chk" + checkboxId++,
		label,
		checked,
		change: event => {
			if(onchange) onchange(event.target.checked);
		},
	};
}

export function Checkbox(key, label, onchange) {
	const path = key.split(".");
	let target = key.startsWith("state.") ? state : store;
	if(target == state) path.shift();
	key = path.pop();
	while(path.length) target = target[path.shift()];
	return CheckboxBase(() => target[key], label, v => {
		target[key] = v;
		if(onchange) onchange();
	});
}
