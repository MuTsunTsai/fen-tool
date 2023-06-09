
const ends = ["1-0", "0-1", "1/2-1/2", "*"];

export function parseMoves(text) {
	// ignore variations
	while(text != (text = text.replace(/\([^()]*\)/g, ""))) { }
	text = text
		.replace(/\{[^}]*\}/g, "") // comments are not nested
		.replace(/;.+$/gm, "") // end-of-line comment
		.replace(/\b(\d+)\./g, "$1 .")
		.replace(/\.+/g, m => m.length > 2 ? "... " : "")
		.replace(/\s+/g, " ")
		.trim();

	let tokens = text.split(" ").filter(m => !m.match(/^\$\d+$/)); // ignore NAG

	const last = tokens[tokens.length - 1];
	if(last && ends.includes(last)) tokens.pop();

	if(tokens[0] == "...") tokens.shift();

	const moves = [];

	let number;
	let roundCount = 0;
	for(let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if(isNum(token)) {
			if(number != token) { // enter a new round
				number = token;
				roundCount = 0;
			} else if(tokens[i + 1] == "...") {
				i++; // ignore next token
			}
		} else if(token == "...") {
			if(moves.length > 0 && (isNum(tokens[i - 1]) || isNum(tokens[i + 1]))) {
				moves.push(token);
				roundCount++;
			}
		} else if(roundCount < 2) {
			moves.push(token);
			roundCount++;
		} else {
			break; // something is not right; stop here
		}
	}

	return moves;
}

function isNum(s) {
	return (/^\d+$/).test(s);
}