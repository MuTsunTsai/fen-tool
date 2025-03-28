import { parse } from "./utils";

export default function() {

	it("Twin add, neutral piece", function() {
		/*
		rema P0534816
		fors 8/5P2/8/8/8/8/5p2/k7
		stip h#2
		opti nowk
		twin add neutral Pf2
		*/
		const input = "stip h#2\nopti nowk\ntwin add neutral Pf2";
		const fen = "8/5P2/8/8/8/8/5p2/k7";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>a) <br><br>  1.f2-f1=R f7-f8=Q   2.Rf1-b1 Qf8-a3 #<br><br>b) nPf2  <br><br>  1.nPf2-f1=nS f7-f8=Q   2.nSf1-d2 Qf8-a3 #<br>  1.nPf2-f1=nB f7-f8=Q   2.nBf1-d3 Qf8-a3 #<br><br>solution finished. Time = 0.068 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(15);

		expect(result[5]).to.equal("8/5P2/8/8/8/8/5-p2/k7");
		expect(result[6]).to.equal("8/5P2/8/8/8/8/8/k4-n2");
	});

	it("All twin commands", function() {
		/*
		fors 8/8/8/8/1k6/8/1K2R3/8
		stip ~1
		opti maxs 1
		twin mir a1<-->h1
		twin sub R S
		twin rotate 90
		twin cont shift a2 b2
		twin rotate 180 shift e4 d4 polish
		twin mir a1<-->h8
		twin move e2 e3
		*/
		const input = "stip ~1\nopti maxs 1\ntwin mir a1<-->h1\ntwin sub R S\ntwin rotate 90\ntwin cont shift a2 b2\ntwin rotate 180 shift e4 d4 polish\ntwin mir a1<-->h8\ntwin move e2 e3";
		const fen = "8/8/8/8/1k6/8/1K2R3/8";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>a) <br><br>   1.Kb2-a1 !<br><br><br>b) mirror a1&lt;--&gt;h1  <br><br>   1.Rd2-d1 !<br><br><br>c) R ==&gt; S  <br><br>   1.Kb2-a1 !<br><br><br>d) rotate 90  <br><br>   1.Kg2-h1 !<br><br><br>+e) shift a2 ==&gt; b2  <br><br>   1.Kh2-h1 !<br><br><br>f) rotate 180  shift e4 ==&gt; d4  PolishType  <br><br>   1.Kf5-e4 !<br><br><br>g) mirror a1&lt;--&gt;h8  <br><br>   1.Rg4-g1 !<br><br><br>h) wRe2--&gt;e3  <br><br>   1.Kb2-a1 !<br><br>Partial solution Time = 1.259 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(16);

		expect(result[2]).to.equal("8/8/8/8/6k1/8/3R2K1/8");
		expect(result[4]).to.equal("8/8/8/8/1k6/8/1K2N3/8");
		expect(result[6]).to.equal("8/8/8/6R1/8/8/4k1K1/8");
		expect(result[8]).to.equal("8/8/8/7R/8/8/5k1K/8");
		expect(result[10]).to.equal("8/2r2k2/8/5K2/8/8/8/8");
		expect(result[12]).to.equal("8/8/8/1R6/8/8/1K1k4/8");
		expect(result[14]).to.equal("8/8/8/8/1k6/4R3/1K6/8");
	});

	it("Twin stipulation", function() {
		/*
		rema P1072567
		fors 8/8/6S1/8/6pp/6k1/4K1B1/7R
		stip h#2
		opti vari
		twin move e2 e1 stip s#2
		*/
		const input = "stip h#2\nopti vari\ntwin move e2 e1 stip s#2";
		const fen = "8/8/6S1/8/6pp/6k1/4K1B1/7R";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>a) <br><br>  1.h4-h3 Sg6-f4   2.h3*g2 Sf4-h5 #<br><br>b) wKe2--&gt;e1  s#2  <br><br>   1.0-0 ! zugzwang.<br>      1...h4-h3<br>          2.Bg2-h1<br>              2...h3-h2 #<br><br><br>solution finished. Time = 0.084 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(10);

		expect(result[6]).to.equal("8/8/6N1/8/6pp/6k1/6B1/5RK1");
	});

	it("PG & non-PG twins", function() {
		/*
		rema P1347104
		fors rsbqkbsr/ppppppp1/8/8/8/8/PPPP1PPP/RSB1KBSR
		stip dia4.0
		twin stip h#1.5
		*/
		const input = "stip dia4.0\ntwin stip h#1.5";
		const fen = "rsbqkbsr/ppppppp1/8/8/8/8/PPPP1PPP/RSB1KBSR";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>a) <br><br>  1.e2-e4 Sg8-f6   2.Qd1-h5 Sf6*e4   3.Qh5*h7 Se4-f6   4.Qh7-g8 Sf6*g8 dia<br><br>b) h#1.5  <br><br>  1...Bf1-d3   2.f7-f6 Bd3-g6 #<br><br>solution finished. Time = 0.128 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(13);

		expect(result[9]).to.equal("rnbqkbnr/ppppppp1/8/8/8/8/PPPP1PPP/RNB1KBNR");
	});
}
