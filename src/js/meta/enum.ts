export enum StockfishStatus {
	notDownloaded = 0,
	downloading = 1,
	needReload = 2,
	ready = 3,
}

export enum StockfishRunning {
	stop = 0,
	starting = 1,
	running = 2,
}

export enum Direction {
	counterclockwise = -1,
	clockwise = 1,
	turn = 2,
}

export enum Color {
	black = "b",
	white = "w",
	neutral = "n",
}

export enum PlayMode {
	normal = "normal",
	pass = "pass",
	retro = "retro",
}

export enum TemplatePieces {
	bK, wK, nK,
	bQ, wQ, nQ,
	bB, wB, nB,
	bN, wN, nN,
	bR, wR, nR,
	bP, wP, nP,
	bC, wC, nC,
	bX, wX, nX,
}
