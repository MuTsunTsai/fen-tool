import { expect } from "chai";

import { INIT_FORSYTH } from "app/meta/fen";
import { parse } from "./utils";

export default function() {

	it("Retracts move on solution branches", function() {
		const input = "stip #3";
		const fen = "r3k3/ppp1p2p/Sb2p3/P1PP2Pp/4S3/7B/3PPRP1/4K2R";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>   1.Rh1-f1 ! threat:<br>          2.Rf2-f8 +<br>              2...Ke8-d7<br>                  3.Bh3*e6 #<br>          2.Bh3*e6 threat:<br>                  3.Rf2-f8 #<br>      1...Bb6*a5<br>          2.Rf2-f8 +<br>              2...Ke8-d7<br>                  3.Bh3*e6 #<br>      1...Bb6*c5<br>          2.Rf2-f8 +<br>              2...Ke8-d7<br>                  3.Sa6*c5 #<br>                  3.Bh3*e6 #<br>      1...0-0-0<br>          2.Bh3*e6 +<br>              2...Rd8-d7<br>                  3.Rf2-f8 #<br>      1...Ke8-d7<br>          2.Bh3*e6 +<br>              2...Kd7-e8<br>                  3.Rf2-f8 #<br>              2...Kd7-d8<br>                  3.Rf2-f8 #<br><br><br>solution finished. Time = 0.078 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(26);
		expect(result[7]).to.equal("r3k3/ppp1p2p/N3p3/b1PP2Pp/4N3/7B/3PPRP1/4KR2");
		expect(result[16]).to.equal("2kr4/ppp1p2p/Nb2p3/P1PP2Pp/4N3/7B/3PPRP1/4KR2");
	});

	it("En passant", function() {
		/*
		fors 3S1s2/K2b1Rs1/1Q6/p2k1q2/2p1pP2/2r1r3/3P4/3S4
		stip #2
		opti vari
		*/
		const input = "stip #2\nopti vari";
		const fen = "3S1s2/K2b1Rs1/1Q6/p2k1q2/2p1pP2/2r1r3/3P4/3S4";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>   1.d2-d4 ! threat:<br>          2.Qb6-c5 #<br>      1...c4*d3 ep.<br>          2.Sd1*e3 #<br>      1...e4*d3 ep.<br>          2.Sd1*c3 #<br>      1...Sg7-e6<br>          2.Rf7*f5 #<br>      1...Sf8-e6<br>          2.Rf7*d7 #<br><br><br>solution finished. Time = 0.060 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(11);

		expect(result[4]).to.equal("3N1n2/K2b1Rn1/1Q6/p2k1q2/4pP2/2rpN3/8/8");
	});

	it("Proof games", function() {
		/*
		fors rsbqkbsr/pppp1p1p/8/4p1p1/1PQP4/8/P1PSPPPP/2KR1BSR
		stip dia6.0
		*/
		const input = "stip dia6.0";
		const fen = "rsbqkbsr/pppp1p1p/8/4p1p1/1PQP4/8/P1PSPPPP/2KR1BSR";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>  1.d2-d4 e7-e5   2.Qd1-d3 Bf8-a3   3.b2-b4 Ba3*c1   4.Qd3-c4 Bc1-h6   5.Sb1-d2 g7-g5   6.0-0-0 Bh6-f8 dia<br><br>solution finished. Time = 0.199 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(13);

		expect(result[0]).to.equal(INIT_FORSYTH);
		expect(result[6]).to.equal("rnbqk1nr/pppp1ppp/8/4p3/1P1P4/3Q4/P1P1PPPP/RNb1KBNR");
		expect(result[12]).to.equal("rnbqkbnr/pppp1p1p/8/4p1p1/1PQP4/8/P1PNPPPP/2KR1BNR");
	});

	it("Duplex castling, abbreviation", function() {
		/*
		for 3bk2r/7p/8/4P3/8/B7/4K3/8
		stip h#3
		opti duplex
		*/
		const input1 = "stip h#3\nopti duplex";
		const fen1 = "3bk2r/7p/8/4P3/8/B7/4K3/8";
		const output1 = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>  1.Bd8-f6 Ba3-b2   2.0-0 e5*f6   3.Kg8-h8 f6-f7 #<br><br>  1.Ke2-f3 Rh8-f8 +   2.Kf3-g4 Rf8-f4 +   3.Kg4-h5 Rf4-h4 #<br><br>solution finished. Time = 1.008 s<br><br><br>";

		const result1 = parse(input1, fen1, output1);
		expect(result1.length).to.equal(14);
		expect(result1[3]).to.equal("5rk1/7p/5b2/4P3/8/8/1B2K3/8");

		/*
		for 8/s7/8/1p6/3b4/4k3/S7/R3K3
		sti h#3
		op dup
		*/
		const input2 = "sti h#3\nop dup";
		const fen2 = "8/s7/8/1p6/3b4/4k3/S7/R3K3";
		const output2 = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>  1.Sa7-c8 Sa2-c3   2.Sc8-d6 Ra1-a3   3.Sd6-e4 Sc3-d5 #<br><br>  1.0-0-0 b5-b4   2.Kc1-b1 Sa7-b5   3.Rd1-c1 Sb5-a3 #<br><br>solution finished. Time = 1.140 s<br><br><br>";

		const result2 = parse(input2, fen2, output2);
		expect(result2.length).to.equal(14);
		expect(result2[8]).to.equal("8/n7/8/1p6/3b4/4k3/N7/2KR4");
	});
}
