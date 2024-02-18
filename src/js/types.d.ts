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
