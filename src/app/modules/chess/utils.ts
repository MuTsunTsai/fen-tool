import { Color } from "app/meta/enum";

type Factory = (arr: (string | number)[]) => void;

export function manipulateFEN(fen: string, ...factories: Factory[]): string {
	const arr = fen.split(" ");
	for(const factory of factories) factory(arr);
	return arr.join(" ");
}

export const switchSide: Factory = arr => {
	arr[1] = arr[1] == Color.black ? Color.white : Color.black;
	arr[3] = "-"; // Always reset ep
};

export const bumpMove: Factory = arr => {
	if(arr[1] == Color.white) arr[5] = Number(arr[5]) + 1;
};

export const resetMove: Factory = arr => {
	arr[4] = 0;
	arr[5] = 1;
};
