import { expect } from "chai";
import { getStipulation, inferMoveOrdering, parseSolution } from "../src/js/meta/popeye.mjs";
import { INIT_FEN } from "../src/js/meta/fen.mjs";

describe("Popeye", function() {

	describe("Stipulation", function() {

		it("Allows spaces before the final number", function() {
			expect(getStipulation("opti no board stipulation   #  2")).to.equal("#2");
			expect(getStipulation("stip \n dia    6.0")).to.equal("dia6.0");
			expect(getStipulation("stip dia     6 .0")).to.equal("dia6");
			expect(getStipulation("stip dia6 6.0"),
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

		it("Retracts move on solution branches", function() {
			const input = "stip #3";
			const fen = "r3k3/ppp1p2p/Nb2p3/P1PP2Pp/4N3/7B/3PPRP1/4K2R";
			const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>   1.Rh1-f1 ! threat:<br>          2.Rf2-f8 +<br>              2...Ke8-d7<br>                  3.Bh3*e6 #<br>          2.Bh3*e6 threat:<br>                  3.Rf2-f8 #<br>      1...Bb6*a5<br>          2.Rf2-f8 +<br>              2...Ke8-d7<br>                  3.Bh3*e6 #<br>      1...Bb6*c5<br>          2.Rf2-f8 +<br>              2...Ke8-d7<br>                  3.Sa6*c5 #<br>                  3.Bh3*e6 #<br>      1...0-0-0<br>          2.Bh3*e6 +<br>              2...Rd8-d7<br>                  3.Rf2-f8 #<br>      1...Ke8-d7<br>          2.Bh3*e6 +<br>              2...Kd7-e8<br>                  3.Rf2-f8 #<br>              2...Kd7-d8<br>                  3.Rf2-f8 #<br><br><br>solution finished. Time = 0.078 s<br><br><br>";

			const result = parse(input, fen, output);
			expect(result.length).to.equal(26);
			expect(result[7]).to.equal("r3k3/ppp1p2p/N3p3/b1PP2Pp/4N3/7B/3PPRP1/4KR2");
			expect(result[16]).to.equal("2kr4/ppp1p2p/Nb2p3/P1PP2Pp/4N3/7B/3PPRP1/4KR2");
		})

		it("Works with en passant", function() {
			const input = "stip #2";
			const fen = "3N1n2/K2b1Rn1/1Q6/p2k1q2/2p1pP2/2r1r3/3P4/3N4";
			const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>   1.d2-d4 ! threat:<br>          2.Qb6-c5 #<br>      1...c4*d3 ep.<br>          2.Sd1*e3 #<br>      1...e4*d3 ep.<br>          2.Sd1*c3 #<br>      1...Sg7-e6<br>          2.Rf7*f5 #<br>      1...Sf8-e6<br>          2.Rf7*d7 #<br><br><br>solution finished. Time = 0.060 s<br><br><br>";

			const result = parse(input, fen, output);
			expect(result.length).to.equal(11);

			expect(result[4]).to.equal("3N1n2/K2b1Rn1/1Q6/p2k1q2/4pP2/2rpN3/8/8");
		});

		it("Works with proof games", function() {
			const input = "stip dia6.0";
			const fen = "rnbqkbnr/pppp1p1p/8/4p1p1/1PQP4/8/P1PNPPPP/2KR1BNR";
			const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>  1.d2-d4 e7-e5   2.Qd1-d3 Bf8-a3   3.b2-b4 Ba3*c1   4.Qd3-c4 Bc1-h6   5.Sb1-d2 g7-g5   6.0-0-0 Bh6-f8 dia<br><br>solution finished. Time = 0.199 s<br><br><br>";

			const result = parse(input, fen, output);
			expect(result.length).to.equal(13);

			expect(result[0]).to.equal(INIT_FEN);
			expect(result[6]).to.equal("rnbqk1nr/pppp1ppp/8/4p3/1P1P4/3Q4/P1P1PPPP/RNb1KBNR");
			expect(result[12]).to.equal("rnbqkbnr/pppp1p1p/8/4p1p1/1PQP4/8/P1PNPPPP/2KR1BNR");
		});

		it("Works with promotion, Rokagogo", function() {
			const input = "stip #4\ncond Rokagogo";
			const fen = "8/8/8/1N2P3/2B5/8/2k2P2/4K2R";
			const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>   1.e5-e6 ! threat:<br>          2.e6-e7 threat:<br>                  3.e7-e8=R threat:<br>                          4.Ke1-e3/wRe8-e2 #<br><br><br>solution finished. Time = 0.407 s<br><br><br>";

			const result = parse(input, fen, output);
			expect(result.length).to.equal(5);

			expect(result[4]).to.equal("8/8/8/1N6/2B5/4K3/2k1RP2/7R");
		});

		it("Works with series help, Take&Make, Circe", function() {
			const input = "stip ser-h=8\ncond Take&Make Circe";
			const fen = "8/8/8/8/8/1NK5/8/7k";
			const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>  1.Kh1-g2   2.Kg2-f3   3.Kf3-e4   4.Ke4-d5   5.Kd5-c6   6.Kc6-b5   7.Kb5-a4   8.Ka4*b3-a1[+wSb1] Kc3-b3 =<br><br>solution finished. Time = 0.092 s<br><br><br>";

			const result = parse(input, fen, output);
			expect(result.length).to.equal(10);

			expect(result[9]).to.equal("8/8/8/8/8/1K6/8/kN6");
		});

		it("Works with duplex castling", function() {
			const input1 = "stip h#3\nopti duplex";
			const fen1 = "3bk2r/7p/8/4P3/8/B7/4K3/8";
			const output1 = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>  1.Bd8-f6 Ba3-b2   2.0-0 e5*f6   3.Kg8-h8 f6-f7 #<br><br>  1.Ke2-f3 Rh8-f8 +   2.Kf3-g4 Rf8-f4 +   3.Kg4-h5 Rf4-h4 #<br><br>solution finished. Time = 1.008 s<br><br><br>";

			const result1 = parse(input1, fen1, output1);
			expect(result1.length).to.equal(13);
			expect(result1[3]).to.equal("5rk1/7p/5b2/4P3/8/8/1B2K3/8");

			const input2 = "stip h#3\nopti duplex";
			const fen2 = "8/s7/8/1p6/3b4/4k3/S7/R3K3";
			const output2 = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>  1.Sa7-c8 Sa2-c3   2.Sc8-d6 Ra1-a3   3.Sd6-e4 Sc3-d5 #<br><br>  1.0-0-0 b5-b4   2.Kc1-b1 Sa7-b5   3.Rd1-c1 Sb5-a3 #<br><br>solution finished. Time = 1.140 s<br><br><br>";

			const result2 = parse(input2, fen2, output2);
			expect(result2.length).to.equal(13);
			expect(result2[7]).to.equal("8/n7/8/1p6/3b4/4k3/N7/2KR4");
		});

		it("Works with twin move, CouscousCirce, Isardam", function() {
			const input = "stip h#2\ncond CouscousCirce Isardam\ntwin move g7 g4";
			const fen = "8/3b2p1/1p6/1pb2n2/R2kr3/pP6/Kn5p/6B1";
			const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>a) <br><br>  1.h2*g1=Q[+wBd8] Ra4-c4   2.Bc5-f8 Bd8*b6[+bPc1=Q] #<br><br>b) bPg7--&gt;g4  <br><br>  1.Sb2*a4[+wRg8] Bg1-e3   2.Re4-e7 Rg8*g4[+bPh1=S] #<br><br>solution finished. Time = 2.097 s<br><br><br>";

			const result = parse(input, fen, output);
			expect(result.length).to.equal(10);

			expect(result[4]).to.equal("5b2/3b2p1/1B6/1p3n2/2Rkr3/pP6/Kn6/2q3q1");
			expect(result[5]).to.equal("8/3b4/1p6/1pb2n2/R2kr1p1/pP6/Kn5p/6B1");
			expect(result[9]).to.equal("8/3br3/1p6/1pb2n2/n2k2R1/pP2B3/K6p/7n");
		})

	});

});

function parse(input, fen, output) {
	const result = [];
	const factory = (text, fen) => {
		result.push(fen);
		return text;
	};
	parseSolution(input, fen, output, factory)
	return result;
}
