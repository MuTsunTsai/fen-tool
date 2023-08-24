import { env } from "../meta/env";

function copyText(text) {
	if(env.canCopy) navigator.clipboard.writeText(text);
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
		state: 0,
		async copy() {
			this.state = 1;
			try {
				let result = factory;
				while(typeof result == "function") {
					result = await result();
				}
				if(typeof result == "string") copyText(result);
				this.state = 2;
				setTimeout(() => this.state = 0, 1000);
			} catch(e) {
				this.state = 0;
			}
		},
	};
}
