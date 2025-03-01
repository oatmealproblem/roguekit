export function rangeFromTo(from: number, to: number, { inclusive = false } = {}) {
	return Array.from({ length: to - from + (inclusive ? 1 : 0) }).map((_, i) => from + i);
}
