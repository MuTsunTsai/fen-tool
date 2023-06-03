
export const canCopy = "clipboard" in navigator && "write" in navigator.clipboard;

function copyText(text) {
	if(canCopy) navigator.clipboard.writeText(text);
	else {
		// polyfill
		const input = document.createElement("input");
		document.body.appendChild(input);
		input.value = text;
		input.select();
		document.execCommand("copy");
		document.body.removeChild(input);
	}
}

export function CopyButton(label, factory, cls, dis) {
	return {
		$template: "#copyBtn",
		cls,
		label,
		dis: dis === undefined ? false : dis,
		done: false,
		copy() {
			copyText(factory());
			this.done = true;
			setTimeout(() => this.done = false, 1000);
		},
	};
}