import { expect } from "chai";
import { makeFEN, parseFEN } from "../src/js/meta/fen.mjs";

describe("FEN Parsing", function() {

	it("Works with orthodox FEN", function() {
		const result = parseFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
		expect(result).to.eql([
			"r", "n", "b", "q", "k", "b", "n", "r",
			"p", "p", "p", "p", "p", "p", "p", "p",
			"", "", "", "", "", "", "", "",
			"", "", "", "", "", "", "", "",
			"", "", "", "", "", "", "", "",
			"", "", "", "", "", "", "", "",
			"P", "P", "P", "P", "P", "P", "P", "P",
			"R", "N", "B", "Q", "K", "B", "N", "R"
		]);
	});

	it("Accepts FEN without slashes", function() {
		const result = parseFEN("rnbqkbnrpppppppp32PPPPPPPPRNBQKBNR")
		expect(result).to.eql([
			"r", "n", "b", "q", "k", "b", "n", "r",
			"p", "p", "p", "p", "p", "p", "p", "p",
			"", "", "", "", "", "", "", "",
			"", "", "", "", "", "", "", "",
			"", "", "", "", "", "", "", "",
			"", "", "", "", "", "", "", "",
			"P", "P", "P", "P", "P", "P", "P", "P",
			"R", "N", "B", "Q", "K", "B", "N", "R"
		]);
	});

	it("Accepts incomplete rows", function() {
		const result = parseFEN("rnbqk/pppppppp/////PPPPPPPP")
		expect(result).to.eql([
			"r", "n", "b", "q", "k", "", "", "",
			"p", "p", "p", "p", "p", "p", "p", "p",
			"", "", "", "", "", "", "", "",
			"", "", "", "", "", "", "", "",
			"", "", "", "", "", "", "", "",
			"", "", "", "", "", "", "", "",
			"P", "P", "P", "P", "P", "P", "P", "P",
			"", "", "", "", "", "", "", "",
		]);
	});

	it("Works with FFEN", function() {
		const result = parseFEN("rnbqkbnr/p2ppppp/2'A5/5''122/3-*1p4/8/PPPPPPP1/2BQKBNR")
		expect(result).to.eql([
			"r", "n", "b", "q", "k", "b", "n", "r",
			"p", "", "", "p", "p", "p", "p", "p",
			"", "", "'A", "", "", "", "", "",
			"", "", "", "", "", "''12", "", "",
			"", "", "", "-*1p", "", "", "", "",
			"", "", "", "", "", "", "", "",
			"P", "P", "P", "P", "P", "P", "P", "",
			"", "", "B", "Q", "K", "B", "N", "R"
		]);
	});

	it("Works with YACPDB FEN", function() {
		const result = parseFEN("rnbq(k1)bnr/pppp(!p)ppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
		expect(result).to.eql([
			"r", "n", "b", "q", "(k1)", "b", "n", "r",
			"p", "p", "p", "p", "(!p)", "p", "p", "p",
			"", "", "", "", "", "", "", "",
			"", "", "", "", "", "", "", "",
			"", "", "", "", "", "", "", "",
			"", "", "", "", "", "", "", "",
			"P", "P", "P", "P", "P", "P", "P", "P",
			"R", "N", "B", "Q", "K", "B", "N", "R"
		]);
	});

});

describe("Make FEN", function() {

	it("Works in all cases", function() {
		const fen = makeFEN([
			"r", "n", "b", "q", "k", "b", "n", "r",
			"p", "", "", "p", "p", "p", "p", "p",
			"", "", "'A", "", "", "", "", "",
			"", "", "", "", "", "''12", "", "",
			"", "", "", "-*1p", "", "", "", "",
			"", "", "", "", "", "", "", "",
			"P", "P", "P", "P", "P", "P", "P", "",
			"", "", "B", "Q", "K", "B", "N", "R"
		], 8, 8);
		expect(fen).to.equal("rnbqkbnr/p2ppppp/2'A5/5''122/3-*1p4/8/PPPPPPP1/2BQKBNR");
	});

});