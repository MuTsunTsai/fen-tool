
export interface ProjectEntry {
	id: number;
	fen: string;
	popeye?: string;
}

export function makeEntry(data: Omit<ProjectEntry, "id">, offset = 0): ProjectEntry {
	return {
		// We cannot assume that the data are unique, so we need an id for Slicksort.
		// Using timestamp is unique enough for our use case.
		id: Date.now() + offset,
		...data,
	};
}
