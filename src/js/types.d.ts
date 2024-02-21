interface Dimension {
	w: number;
	h: number;
}

interface IPoint {
	x: number;
	y: number;
}

interface Board extends Array<string> {
	anime?: string;
}

type Action = () => void;

type Consumer<T> = (arg: T) => void;

type Writeable<T> = { -readonly [P in keyof T]: T[P] };
