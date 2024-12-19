import { Chess } from "app/modules/chess/chess";

describe("Retro mode", function() {

	it("Cannot make capturing", function() {
		const chess = new Chess();
		chess.init("8/8/3k4/8/8/3KR3/8/8 b - - 0 1");
		expect(chess.retract({ from: "d3", to: "e3" })).to.be.false;
		expect(chess.retract({ from: "d3", to: "d2" })).to.be.true;
	});

	it("Cannot check", function() {
		const chess = new Chess();
		chess.init("8/k7/8/3R4/8/4K3/8/8 b - - 0 1");
		expect(chess.retract({ from: "d5", to: "e7" })).to.be.false;
		expect(chess.retract({ from: "d5", to: "a5" })).to.be.false;
		expect(chess.retract({ from: "d5", to: "h5" })).to.be.true;
	});

	it("The checking side must uncheck", function() {
		const chess = new Chess();
		chess.init("8/k2R4/8/8/8/4K3/8/8 b - - 0 1");
		expect(chess.retract({ from: "e3", to: "d3" })).to.be.false;
		expect(chess.retract({ from: "d7", to: "h7" })).to.be.false;
		expect(chess.retract({ from: "d7", to: "d6" })).to.be.true;
	});

	it("Must retract pawn after en passant", function() {
		const chess = new Chess();
		chess.init("8/8/1k4P1/8/8/4K3/8/8 b - - 0 1");
		expect(chess.retract({ from: "g6", to: "f5", uncapture: "c" })).to.be.true;
		expect(chess.retract({ from: "b6", to: "b5" })).to.be.false;
		expect(chess.retract({ from: "g5", to: "g6" })).to.be.false;
		expect(chess.retract({ from: "g5", to: "g7" }), "Must retract two step pawn move").to.be.true;
	});

	it("Cannot uncastle if the home square of the rook is occupied", function() {
		const chess = new Chess();
		chess.init("8/2k5/8/8/8/8/8/N1KR4 b - - 0 1");
		expect(chess.retract({ from: "c1", to: "e1" }), "Uncastling").to.be.false;
	});

	it("Cannot move the king or rook after uncastling", function() {
		const chess = new Chess();
		chess.init("8/8/3k4/8/8/8/R7/2KR4 b - - 0 1");
		expect(chess.retract({ from: "c1", to: "e1" }), "Uncastling").to.be.true;
		expect(chess.retract({ from: "d6", to: "c6" })).to.be.true;
		expect(chess.retract({ from: "e1", to: "f1" }), "Cannot move the king anymore").to.be.false;
		expect(chess.retract({ from: "a1", to: "b1" }), "Cannot move the rook anymore").to.be.false;
		expect(chess.retract({ from: "a2", to: "b2" }), "Other rooks are not affected").to.be.true;
	});

});
