
export function manipulateFEN(fen, ...factories) {
	const arr = fen.split(" ");
	for(const factory of factories) factory(arr);
	return arr.join(" ");
}

export const switchSide = arr => {
	arr[1] = arr[1] == "b" ? "w" : "b";
	arr[3] = "-"; // Always reset ep
};

export const bumpMove = arr => {
	if(arr[1] == "w") arr[5] = Number(arr[5]) + 1;
};

export const resetMove = arr => {
	arr[4] = 0;
	arr[5] = 1;
};
