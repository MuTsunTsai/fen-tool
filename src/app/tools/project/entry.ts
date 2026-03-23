
export interface ProjectEntry {
	/** Unique identifier for Slicksort, generated from timestamp. */
	id: number;

	/** Board position in FEN string (supports Fairy FEN). */
	fen: string;

	/** Popeye input text; present when this entry is a Popeye problem. */
	popeye?: string;

	/** Popeye output solution, with optional comments in curly braces. */
	solution?: string;
}

export function makeEntry(data: Omit<ProjectEntry, "id">, offset = 0): ProjectEntry {
	return {
		// We cannot assume that the data are unique, so we need an id for Slicksort.
		// Using timestamp is unique enough for our use case.
		id: Date.now() + offset,
		...data,
	};
}
