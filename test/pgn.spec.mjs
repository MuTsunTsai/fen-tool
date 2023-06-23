import { expect } from "chai";
import { parseMoves } from "../src/js/modules/pgn.mjs";

describe("PGN Parsing", function() {

	it("Works with regular PGN", function() {
		const result = parseMoves("1. e4 e5 2. Nf3 Nc6");
		expect(result).to.eql(["e4", "e5", "Nf3", "Nc6"]);
	});

	it("Works with comments in between", function() {
		const result = parseMoves("1. e4 { next token is number } 1... e5 2. Nf3 { or not } ...Nc6");
		expect(result).to.eql(["e4", "e5", "Nf3", "Nc6"]);
	});

	it("Works with passing moves", function() {
		const result = parseMoves("1... Qf6 2... Kb2 3... Ra2 4... Ka1 5... Rc2 6... Ka2 7... Qa1 8... Rb2 9. Nc3#");
		expect(result).to.eql(["Qf6", "...", "Kb2", "...", "Ra2", "...", "Ka1", "...", "Rc2", "...", "Ka2", "...", "Qa1", "...", "Rb2", "Nc3#"]);
	});

	it("Must have correct move numbers", function() {
		const result = parseMoves("1. e4 e5 c3 2. Nf3 Nc6");
		expect(result).to.eql(["e4", "e5"]);
	});

});