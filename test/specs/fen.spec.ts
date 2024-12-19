import { inferDimension, makeForsyth, normalizeSpaceRepresentation, parseFEN } from "app/meta/fen";

describe("FEN", function() {

	describe("FEN Parsing", function() {

		it("Infers spacing systems", function() {
			const result = normalizeSpaceRepresentation("31Q12/211112/111113/2C5/1111211/11P113/1P*2n14/111113");
			expect(result).to.equal("4Q3/8/8/2C5/8/2P5/1P*2n5/8");
		});

		it("Works with orthodox FEN", function() {
			const result = parseFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
			expect(result).to.eql([
				"r", "n", "b", "q", "k", "b", "n", "r",
				"p", "p", "p", "p", "p", "p", "p", "p",
				"", "", "", "", "", "", "", "",
				"", "", "", "", "", "", "", "",
				"", "", "", "", "", "", "", "",
				"", "", "", "", "", "", "", "",
				"P", "P", "P", "P", "P", "P", "P", "P",
				"R", "N", "B", "Q", "K", "B", "N", "R",
			]);
		});

		it("Accepts FEN without slashes", function() {
			const result = parseFEN("rnbqkbnrpppppppp32PPPPPPPPRNBQKBNR");
			expect(result).to.eql([
				"r", "n", "b", "q", "k", "b", "n", "r",
				"p", "p", "p", "p", "p", "p", "p", "p",
				"", "", "", "", "", "", "", "",
				"", "", "", "", "", "", "", "",
				"", "", "", "", "", "", "", "",
				"", "", "", "", "", "", "", "",
				"P", "P", "P", "P", "P", "P", "P", "P",
				"R", "N", "B", "Q", "K", "B", "N", "R",
			]);
		});

		it("Accepts incomplete rows", function() {
			const result = parseFEN("rnbqk/pppppppp/////PPPPPPPP");
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
			const result = parseFEN("rnbqkbnr/p2'👩🏽‍⚖️pppp/2'A5/5''122/3-*1p4/8/PPPPPPP1/2BQKBNR");
			expect(result).to.eql([
				"r", "n", "b", "q", "k", "b", "n", "r",
				"p", "", "", "'👩🏽‍⚖️", "p", "p", "p", "p",
				"", "", "'A", "", "", "", "", "",
				"", "", "", "", "", "''12", "", "",
				"", "", "", "-*1p", "", "", "", "",
				"", "", "", "", "", "", "", "",
				"P", "P", "P", "P", "P", "P", "P", "",
				"", "", "B", "Q", "K", "B", "N", "R",
			]);
		});

		it("Can infer board dimension", function() {
			const fen = "4/4/4/4/4";
			const board = inferDimension(fen)!;
			expect(board.w).to.equal(4);
			expect(board.h).to.equal(5);

			const result = parseFEN(fen, board.w, board.h);
			expect(result.length).to.equal(20);
		});

		it("Works with YACPDB FEN", function() {
			const result = parseFEN("rnbq(k1)bnr/pppp(!p)ppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
			expect(result).to.eql([
				"r", "n", "b", "q", "(k1)", "b", "n", "r",
				"p", "p", "p", "p", "(!p)", "p", "p", "p",
				"", "", "", "", "", "", "", "",
				"", "", "", "", "", "", "", "",
				"", "", "", "", "", "", "", "",
				"", "", "", "", "", "", "", "",
				"P", "P", "P", "P", "P", "P", "P", "P",
				"R", "N", "B", "Q", "K", "B", "N", "R",
			]);
		});

	});

	describe("Make FEN", function() {

		it("Works in all cases", function() {
			const fen = makeForsyth([
				"r", "n", "b", "q", "k", "b", "n", "r",
				"p", "", "", "p", "p", "p", "p", "p",
				"", "", "'A", "", "", "", "", "",
				"", "", "", "", "", "''12", "", "",
				"", "", "", "-*1p", "", "", "", "",
				"", "", "", "", "", "'👩🏽‍⚖️", "", "",
				"P", "P", "P", "P", "P", "P", "P", "",
				"", "", "B", "Q", "K", "B", "N", "R",
			], 8, 8);
			expect(fen).to.equal("rnbqkbnr/p2ppppp/2'A5/5''122/3-*1p4/5'👩🏽‍⚖️2/PPPPPPP1/2BQKBNR");
		});

	});

});
