import { parse } from "./utils";

export default function() {

	it("Rokagogo", function() {
		/*
		fors 8/8/8/1S2P3/2B5/8/2k2P2/4K2R
		stip #4
		cond Rokagogo
		opti vari
		*/
		const input = "stip #4\ncond Rokagogo";
		const fen = "8/8/8/1S2P3/2B5/8/2k2P2/4K2R";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>   1.e5-e6 ! threat:<br>          2.e6-e7 threat:<br>                  3.e7-e8=R threat:<br>                          4.Ke1-e3/wRe8-e2 #<br><br><br>solution finished. Time = 0.407 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(5);

		expect(result[4]).to.equal("8/8/8/1N6/2B5/4K3/2k1RP2/7R");
	});

	it("Take&Make, Circe", function() {
		/*
		fors 8/8/8/8/8/1SK5/8/7k
		stip ser-h=8
		cond Take&Make Circe
		*/
		const input = "stip ser-h=8\ncond Take&Make Circe";
		const fen = "8/8/8/8/8/1SK5/8/7k";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>  1.Kh1-g2   2.Kg2-f3   3.Kf3-e4   4.Ke4-d5   5.Kd5-c6   6.Kc6-b5   7.Kb5-a4   8.Ka4*b3-a1[+wSb1] Kc3-b3 =<br><br>solution finished. Time = 0.092 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(10);

		expect(result[9]).to.equal("8/8/8/8/8/1K6/8/kN6");
	});

	it("CouscousCirce, Isardam", function() {
		/*
		fors 8/3b2p1/1p6/1pb2s2/R2kr3/pP6/Ks5p/6B1
		stip h#2
		cond CouscousCirce Isardam
		twin move g7 g4
		*/
		const input = "stip h#2\ncond CouscousCirce Isardam\ntwin move g7 g4";
		const fen = "8/3b2p1/1p6/1pb2s2/R2kr3/pP6/Ks5p/6B1";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>a) <br><br>  1.h2*g1=Q[+wBd8] Ra4-c4   2.Bc5-f8 Bd8*b6[+bPc1=Q] #<br><br>b) bPg7--&gt;g4  <br><br>  1.Sb2*a4[+wRg8] Bg1-e3   2.Re4-e7 Rg8*g4[+bPh1=S] #<br><br>solution finished. Time = 2.097 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(10);

		expect(result[4]).to.equal("5b2/3b2p1/1B6/1p3n2/2Rkr3/pP6/Kn6/2q3q1");
		expect(result[5]).to.equal("8/3b4/1p6/1pb2n2/R2kr1p1/pP6/Kn5p/6B1");
		expect(result[9]).to.equal("8/3br3/1p6/1pb2n2/n2k2R1/pP2B3/K6p/7n");
	});

	it("Volage", function() {
		/*
		rema P1178572
		fors 8/8/5Kp1/8/8/5k2/pp6/8
		stip ser-h=3
		cond circe volage
		*/
		const input = "stip ser-h=3\ncond circe volage";
		const fen = "8/8/5Kp1/8/8/5k2/pp6/8";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>  1.b2-b1=B=w   2.a2*b1=Q[+wBf1]   3.Qb1-e1=w Kf6-g5 =<br><br>solution finished. Time = 0.057 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(5);

		expect(result[1]).to.equal("8/8/5Kp1/8/8/5k2/p7/1B6");
		expect(result[2]).to.equal("8/8/5Kp1/8/8/5k2/8/1q3B2");
		expect(result[3]).to.equal("8/8/5Kp1/8/8/5k2/8/4QB2");
	});

	it("Tibet", function() {
		/*
		rema P1075867
		fors 8/2P5/8/6K1/8/8/k3p3/8
		stip h=3
		cond circe tibet
		opti whitetoplay
		*/
		const input = "fors 8/2P5/8/6K1/8/8/k3p3/8\nstip h=3\ncond circe tibet\nopti whitetoplay";
		const fen = "8/2P5/8/6K1/8/8/k3p3/8";
		const output = "Popeye WASM-32Bit v4.89 (512 MB)<br><br>  1...c7-c8=Q   2.e2-e1=B Qc8-c3   3.Be1*c3=w[+wQd1] Bc3-b2 =<br>  1...c7-c8=R   2.e2-e1=S Rc8-c2 +   3.Se1*c2=w[+wRh1] Rh1-b1 =<br><br>solution finished. Time = 0.238 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(12);

		expect(result[11]).to.equal("8/8/8/6K1/8/8/k1N5/1R6");
	});

	it("Swapping", function() {
		/*
		rema P1067437
		fors rsbQKbsr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RSBkqBSR
		stip dia4.5
		cond swapping
		*/
		const input = "stip dia4.5\ncond swapping";
		const fen = "rnbQKbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBkqBNR";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>  1.e2-e4 c7-c6   2.Qd1-h5 Qd8-b6   3.Ke1-d1 Qb6-e3   4.Qh5-a5 Qe3-e1[Ke8&lt;-&gt;Kd1]   5.Qa5-d8 dia<br><br>solution finished. Time = 9.284 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(10);

		expect(result[9]).to.equal("rnbQKbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBkqBNR");
	});

	it("Masand, AntiSuperCirce", function() {
		/*
		rema P1255792
		fors 6K1/3q4/2p4k/1R1r4/8/8/8/8
		stip hs#3
		cond masand antisupercirce
		*/
		const input = "stip hs#3\ncond masand antisupercirce";
		const fen = "6K1/3q4/2p4k/1R1r4/8/8/8/8";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>  1.Rb5-a5 Qd7-e6[d5=w][c6=w] +   2.Kg8-h8 Qe6*c6[bQc6-&gt;b7]   3.Rd5-d6 + Qb7-b8[d6=b] #<br>  1.Rb5-b7 Qd7-c8[c6=w][b7=b] +   2.c6*b7[wPb7-&gt;e8=Q] Qc8-c1   3.Qe8-e6[d5=w] + Qc1-c8[e6=b] #<br><br>solution finished. Time = 40.379 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(14);

		expect(result[2]).to.equal("6K1/8/2P1q2k/R2R4/8/8/8/8");
		expect(result[4]).to.equal("7K/1q6/7k/R2R4/8/8/8/8");
		expect(result[6]).to.equal("1q5K/8/3r3k/R7/8/8/8/8");
		expect(result[9]).to.equal("2q3K1/1r6/2P4k/3r4/8/8/8/8");
		expect(result[10]).to.equal("2q1Q1K1/8/7k/3r4/8/8/8/8");
		expect(result[12]).to.equal("6K1/8/4Q2k/3R4/8/8/8/2q5");
		expect(result[13]).to.equal("2q3K1/8/4q2k/3R4/8/8/8/8");
	});

	it("KobulKing, Sentinels", function() {
		/*
		rema https://www.thehoppermagazine.com/SS110
		fors 8/2k2p2/8/8/3K4/8/5s2/1b6
		stip h#3
		cond kobul senti
		*/
		const input = "stip h#3\ncond kobul senti";
		const fen = "8/2k2p2/8/8/3K4/8/5s2/1b6";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>  1.Bb1-e4 Kd4-c5[+wPd4]   2.Be4-c6[+bPe4] Kc5*c6[c7=rB][+wPc5] +   3.rBc7-b8[+bPc7] Kc6-b7[+wPc6] #<br>  1.Sf2-e4[+bPf2] Kd4-e5[+wPd4]   2.Se4-f6[+bPe4] Ke5*f6[c7=rS][+wPe5]   3.rSc7-e8[+bPc7] + Kf6-e7[+wPf6] #<br><br>solution finished. Time = 1.633 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(14);

		expect(result[4]).to.equal("8/2b2p2/2K5/2P5/3Pp3/8/5n2/8");
		expect(result[6]).to.equal("1b6/1Kp2p2/2P5/2P5/3Pp3/8/5n2/8");
		expect(result[11]).to.equal("8/2n2p2/5K2/4P3/3Pp3/8/5p2/1b6");
	});

	it("Breton", function() {
		/*
		rema P1364988
		fors 1S2Q1q1/Pb1rs3/pb1p1Rp1/2pkp3/2s1r3/1P1K4/1pP5/7B
		stip #2
		cond breton
		opti vari
		*/
		const input = "stip #2\ncond breton\nopti vari";
		const fen = "1S2Q1q1/Pb1rs3/pb1p1Rp1/2pkp3/2s1r3/1P1K4/1pP5/7B";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>   1.a7-a8=S ! threat:<br>          2.b3*c4[-wSa8] #<br>      1...Sc4-a3<br>          2.Sa8*b6[-wBh1] #<br>      1...Sc4-d2<br>          2.Sa8*b6[-wBh1] #<br>      1...Sc4-e3<br>          2.Sa8*b6[-wBh1] #<br>      1...Sc4-a5<br>          2.Sa8*b6[-wBh1] #<br>      1...Bb7*a8[-bSc4]<br>          2.c2-c4 #<br>      1...Bb7*a8[-bSe7]<br>          2.Bh1*e4[-wRf6] #<br><br><br>solution finished. Time = 0.025 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(15);

		expect(result[4]).to.equal("1N2Q1q1/1b1rn3/pN1p1Rp1/2pkp3/4r3/nP1K4/1pP5/8");
		expect(result[12]).to.equal("bN2Q1q1/3rn3/pb1p1Rp1/2pkp3/2P1r3/1P1K4/1p6/7B");
	});

	it("Imitator", function() {
		/*
		rema P1258141
		fors 5k2/5P1S/5K2/8/8/7P/8/8
		stip =3
		cond imitator h6
		opti vari
		*/
		const input = "stip =3\ncond imitator h5\nopti vari";
		const fen = "5k2/5P1S/5K2/8/8/7P/8/8";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>   1.Sh7-g5[Ig4] ! threat:<br>          2.Sg5-e4[Ie3] =<br>          2.Sg5-h7[Ih6] =<br>          2.Sg5-e6[Ie5] =<br>      1...Kf8-g8[Ih4]<br>          2.f7-f8[Ih5]=I zugzwang.<br>              2...Kg8-f7[Ig4,e7] +<br>                  3.Kf6-g7[Ih5,f8] =<br>              2...Kg8-g7[Ih4,f7] +<br>                  3.Kf6-f7[Ih5,f8] =<br><br><br>solution finished. Time = 0.048 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(11);

		expect(result[6]).to.equal("5-ck1/8/5K2/6N-c/8/7P/8/8");
	});

	it("MirrorCirce", function() {
		/*
		rema P1178914
		fors rsbqkbsr/pppppppp/8/8/8/8/6P1/8
		stip h#4
		cond MirrorCirce imitator b6h6
		opti nowk
		*/
		const input = "stip h#4\ncond MirrorCirce imitator b6h6\nopti nowk";
		const fen = "rsbqkbsr/pppppppp/8/8/8/8/6P1/8";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>  1.f7-f5[Ib4,h4] g2-g4[Ib6,h6]   2.h7-h6[Ib5,h5] g4*f5[Ia6,g6][+bPf2]   3.Sb8-c6[Ib4,h4] f5-f6[Ib5,h5]   4.f2-f1[Ib4,h4]=I f6-f7[Ib5,h5,f2] #<br><br>solution finished. Time = 0.163 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(9);

		expect(result[0]).to.equal("rnbqkbnr/pppppppp/1-c5-c/8/8/8/6P1/8");
		expect(result[8]).to.equal("r1bqkbnr/pppppPp1/2n4p/1-c5-c/8/8/5-c2/8");
	});

	it("Grasshopper, Nightrider", function() {
		/*
		rema P0500886
		fors 8/1b3=p=p1/3p4/k7/2p5/p7/=n1=p3p1/1=g4K1
		stip h#2
		cond circe
		twin move a5 f6
		*/
		const input = "stip h#2\ncond circe\ntwin move a5 f6";
		const fen = "8/1b3=p=p1/3p4/k7/2p5/p7/=n1=p3p1/1=g4K1";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>a) <br><br>  1.nPc2*b1=nS[+nGb8] nPg7-g8=nR   2.nSb1-c3 nPf7*g8=nN[+nRa8] #<br><br>b) bKa5--&gt;f6  <br><br>  1.nPc2*b1=nB[+nGb8] nPf7-f8=nG   2.nBb1-f5 nPg7*f8=nQ[+nGf1] #<br><br>solution finished. Time = 1.900 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(10);

		expect(result[4]).to.equal("-r-*2q4-*2n1/1b6/3p4/k7/2p5/p1-n5/-*2n5p1/6K1");
		expect(result[9]).to.equal("1-*2q3-q2/1b6/3p1k2/5-b2/2p5/p7/-*2n5p1/5-*2qK1");
	});

	it("Kangaroo", function() {
		/*
		rema P1088273
		fors k7/1.ka6/1.ka6/2K5/8/8/8/8
		stip ser-h=12
		*/
		const input = "stip ser-h=12";
		const fen = "k7/1.ka6/1.ka6/2K5/8/8/8/8";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>  1.Ka8-a7   2.Ka7-a6   3.Ka6-a5   4.Ka5-a4   5.Ka4-b3   6.KAb7-b2   7.Kb3-a4   8.Ka4-a5   9.Ka5-a6  10.Ka6-b7  11.KAb2-b8  12.Kb7-a8 Kc5*b6 =<br><br>solution finished. Time = 0.033 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(14);

		expect(result[0]).to.equal("k7/1*1q6/1*1q6/2K5/8/8/8/8");
		expect(result[13]).to.equal("k*1q6/8/1K6/8/8/8/8/8");
	});

	it("AntiMarsCirce", function() {
		/*
		fors 1S1S4/5R2/8/2k2P2/8/4Rp1b/8/K2s4
		stip #2
		opt set var try
		cond antimarscirce
		*/
		const input = "stip #2\nopt set var try\ncond antimarscirce";
		const fen = "1S1S4/5R2/8/2k2P2/8/4Rp1b/8/K2s4";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>      1...Bh3*f5<br>          2.Rf7*f5 #<br>      1...Bh3-c8-a6<br>          2.Sb8*a6 #<br>      1...Bh3-c8-b7<br>          2.Sd8*b7 #<br>      1...Bh3-c8-e6<br>          2.Sd8*e6 #<br>      1...Bh3-c8-d7<br>          2.Sb8*d7 #<br><br>   1.Ka1-e1-d2 ? threat:<br>          2.Re3-a1-a5 #<br>          2.Re3-a1-c1 #<br>    but<br>      1...Sd1*e3 !<br><br>   1.Re3*f3 ! zugzwang.<br>      1...Sd1-g8-e7<br>          2.Rf3-h1-c1 #<br>      1...Sd1-g8-f6<br>          2.Rf3-h1-c1 #<br>      1...Sd1-g8-h6<br>          2.Rf3-h1-c1 #<br>      1...Bh3*f5<br>          2.Rf3*f5 #<br>      1...Bh3-c8-a6<br>          2.Sb8*a6 #<br>      1...Bh3-c8-b7<br>          2.Sd8*b7 #<br>      1...Bh3-c8-e6<br>          2.Sd8*e6 #<br>      1...Bh3-c8-d7<br>          2.Sb8*d7 #<br><br><br>solution finished. Time = 0.076 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(38);

		expect(result[15]).to.equal("1N1N4/5R2/8/2k2P2/8/4Rp1b/8/K2n4");
		expect(result[16]).to.equal("1N1N4/5R2/8/2k2P2/8/4Rp1b/3K4/3n4");
	});

	it("MarsCirce", function() {
		/*
		fors 3Q4/4R3/8/K7/1b6/ks6/1r6/SR6
		stip h#2
		cond marscirce
		*/
		const input = "stip h#2\ncond marscirce";
		const fen = "3Q4/4R3/8/K7/1b6/ks6/1r6/SR6";
		const output = "Popeye wasm-32Bit v4.87 (512 MB)<br><br>  1.Rb2-h8*d8 Rb1-b2   2.Sb3-g8*e7 Sa1-b3 #<br>  1.Sb3-g8*e7 Sa1-b3   2.Rb2-h8*d8 Rb1-b2 #<br><br>solution finished. Time = 1.658 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(10);

		expect(result[1]).to.equal("3r4/4R3/8/K7/1b6/kn6/8/NR6");
		expect(result[3]).to.equal("3r4/4n3/8/K7/1b6/k7/1R6/N7");
		expect(result[6]).to.equal("3Q4/4n3/8/K7/1b6/k7/1r6/NR6");
		expect(result[8]).to.equal("3r4/4n3/8/K7/1b6/kN6/8/1R6");
	});

	it("Series capture", function() {
		/*
		fors 8/8/8/8/2K5/1psp4/p7/k7
		stip =1
		cond seriescapture
		*/
		const input = "stip =1\ncond seriescapture";
		const fen = "8/8/8/8/2K5/1psp4/p7/k7";
		const output = "Popeye wasm-32Bit v4.89 (512 MB)<br><br>   1.Kc4*b3*c3*d3-c2 = !<br><br>   1.Kc4*d3*c3*b3-c2 = !<br><br><br>solution finished. Time = 0.027 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(4);

		expect(result[1]).to.equal("8/8/8/8/8/8/p1K5/k7");
	});

	it("Series capture with promotion", function() {
		/*
		fors k3b3/b1K2p2/6p1/7p/6p1/5p2/4P3/8
		stip #1
		cond seriescapture
		*/
		const input = "stip #1\ncond seriescapture";
		const fen = "k3b3/b1K2p2/6p1/7p/6p1/5p2/4P3/8 w KQkq - 0 1";
		const output = "Popeye wasm-32Bit v4.89 (512 MB)<br><br>   1.e2*f3*g4*h5*g6*f7*e8=B-c6 # !<br><br><br>solution finished. Time = 0.044 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(2);

		expect(result[1]).to.equal("k7/b1K5/2B5/8/8/8/8/8");
	});

	it("Hurdle Color Change", function() {
		/*
		stip h#3
		opt nowk
		auth Stephen Emmerson
		orig Unpublished
		tit N.B. minor dual in (b)
		pie blac ke8
		pie blac hur gd8 ma8 eaf8 swg8
		twin move a8 h8
		*/

		const input = "stip h#3\nopt nowk\ntwin move a8 h8";
		const fen = "m2gk.ea.sw1/8/8/8/8/8/8/8";
		const output = "Popeye WASM-32Bit v4.89 (512 MB)<br><br>a) <br><br>  1.hccMa8-e7[d8=w] hccGd8-f6[e7=w]   2.hccSWg8-g7[f8=w] hccEAf8-g6[f6=b]   3.hccSWg7-f7[f6=w] hccEAg6-e6[f7=w] #<br><br>b) bhccMa8--&gt;h8  <br><br>  1.hccEAf8-g7[g8=w] hccSWg8-f8[g7=w]   2.hccMh8-g6[g7=b] hccSWf8-f7   3.hccMg6-f8[g7=w] hccSWf7-e7[f8=w] #<br>  1.hccEAf8-g7[g8=w] hccSWg8-f8[g7=w]   2.hccMh8-g6[g7=b] hccSWf8-f7   3.hccMg6-f8[g7=w] hccSWf7-e7 #<br><br>solution finished. Time = 0.139 s<br><br><br>";

		const result = parse(input, fen, output);
		expect(result.length).to.equal(21);

		expect(result[6]).to.equal("4k3/4*3Q*1N2/4*3R*2Q2/8/8/8/8/8");
		expect(result[13]).to.equal("3*2qk*3Q2/4*1N1*3R1/8/8/8/8/8/8");
		expect(result[20]).to.equal("3*2qk*3q2/4*1N1*3R1/8/8/8/8/8/8");
	});

}
