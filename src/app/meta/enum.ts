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

export enum Rotation {
	r90 = 1,
	r180 = 2,
	r270 = 3,
	full = 4,
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

export enum TemplateMap {
	bK, wK, nK,
	bQ, wQ, nQ,
	bB, wB, nB,
	bN, wN, nN,
	bR, wR, nR,
	bP, wP, nP,
	bC, wC, nC,
	bX, wX, nX,
}

export enum TemplateRow {
	k, q, b, n, r, p, c, x,
}

export enum Background {
	gray = "gray",
	green = "green",
	classic = "classic",
}

export enum Tabs {
	edit = 0,
	options = 1,
	database = 2,
	bbs = 4,
	api = 5,
	play = 6,
	compute = 7,
	project = 8,
}
