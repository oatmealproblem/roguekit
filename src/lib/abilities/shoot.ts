import actions from '$lib/actions';
import { getLine } from '$lib/geo';
import type { Ability } from '$lib/types';

export const shoot: Ability = {
	target: 'tile',
	highlight(actor, targetPos, game) {
		const line = getLine(actor, targetPos);
		const hitIndex = line.slice(1).findIndex((pos) => game.at(pos).some((e) => e.hp)) + 1;
		const target = hitIndex ? [line[hitIndex]] : [];
		const guide = hitIndex ? line.slice(0, hitIndex) : line;
		return { guide, hit: target };
	},
	execute(actor, targetPos, game) {
		game.playSfx('laser');
		for (const pos of this.highlight(actor, targetPos, game).hit) {
			for (const entity of game.at(pos)) {
				actions.damage({ game, target: entity, amount: 5 });
			}
		}
	},
};
