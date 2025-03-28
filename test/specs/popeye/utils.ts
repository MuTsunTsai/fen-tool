import { parseSolution } from "app/meta/popeye/popeye";

export function parse(input: string, fen: string, output: string): string[] {
	const result: string[] = [];
	const factory = (text: string, position: string): string => {
		result.push(position);
		return text;
	};
	parseSolution(input, fen, output, factory);
	return result;
}
