import { expect } from "chai";

import { getStipulations, inferMoveOrdering } from "app/meta/popeye/popeye";
import { pieceMap, toPopeyePiece } from "app/meta/popeye/base";
import { parsePieceCommand } from "app/meta/popeye/piece";
import fairySpec from "./fairy.spec";
import twinSpec from "./twin.spec";
import basicSpec from "./basic.spec";

pieceMap.custom = () => ({
	"*1B": "25",
	"*2Q": "G",
	"*1Q": "KA",
});

describe("Popeye", function() {

	describe("Piece conversion", function() {

		it("Converts N to S", function() {
			expect(toPopeyePiece("N")).to.equal("S");
		});

		it("Converts fairy pieces", function() {
			expect(toPopeyePiece("*2q")).to.equal("g");
			expect(toPopeyePiece("*1B")).to.equal("+.25");
			expect(toPopeyePiece("-*1B")).to.equal("=.25");
		});

	});

	describe("Pieces list parsing", function() {

		it("Parse piece list", function() {
			const input = "pie wh kam rha5 bc4d4 pf4 kf1\npie bl kam ra1a8c8d8 bb8e8 sh4h7 pg5a2 kh5";
			expect(parsePieceCommand(input)).to.equal("rbrrb3/7s/8/.RH5pk/2BB1P1s/8/p7/r4K2");

			console.log(parsePieceCommand("pieces white kd7 qg5 rc4 bd5 sg1 pa2e4e7f6\n\tblack kd3 bf8h1 pd6e2g2g6"));
		});

	});

	describe("Stipulation", function() {

		it("Allows spaces before the final number", function() {
			expect(getStipulations("opti no board stipulation   #  2")[0]).to.equal("#2");
			expect(getStipulations("stip \n dia    6.0")[0]).to.equal("dia6.0");
			expect(getStipulations("stip dia     6 .0")[0]).to.equal("dia6");
			expect(getStipulations("stip dia6 6.0")[0],
				"but only if the last character of the first segment is not a digit"
			).to.equal("dia6");
		});

		it("Move order is BW for help problems", function() {
			expect(inferMoveOrdering("#3")).to.equal("wb");
			expect(inferMoveOrdering("dia6.0")).to.equal("wb");
			expect(inferMoveOrdering("ser-dia6.0")).to.equal("wb");
			expect(inferMoveOrdering("ser-h#2")).to.equal("bw");
			expect(inferMoveOrdering("h#10")).to.equal("bw");
			expect(inferMoveOrdering("hs#6"), "not help-self problems").to.equal("wb");
			expect(inferMoveOrdering("hr#6"), "not help-reflex problems").to.equal("wb");

			// With the initial `m->`, the solution could actually be a mixture of wb/bw ordering,
			// but let's not worrying about that for now.
			expect(inferMoveOrdering("3->ser-h#2")).to.equal("wb");
		});

	});

	describe("Output parsing", function() {

		describe("Basics", basicSpec);

		describe("Twin", twinSpec);

		describe("Fairy", fairySpec);

	});

});

