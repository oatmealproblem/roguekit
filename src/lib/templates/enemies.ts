import type { Entity } from '$lib/types';

export const enemies = {
	goblin: {
		ai: true,
		team: 'enemy',
		attack: { damage: 1 },
		glyph: { char: 'G', color: 'limegreen' },
		hp: { current: 5, max: 5 },
	},
} satisfies Record<string, Omit<Entity, 'x' | 'y' | 'id'>>;
