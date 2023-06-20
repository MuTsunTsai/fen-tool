import { Chess as ChessBase } from "chess.js";

export class Chess extends ChessBase {

	checkPromotion(from, to) {
		const moves = this.moves({ verbose: true });
		return moves.some(m => m.from == from && m.to == to && m.flags.includes("p"));
	}

	switchSide() {
		const fen = this.fen().split(" ");
		if(fen[1] == "b") fen[1] = "w";
		else fen[1] = "b";
		this.load(fen.join(" "));
	}
}