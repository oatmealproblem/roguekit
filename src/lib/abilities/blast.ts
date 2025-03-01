import actions from '$lib/actions';
import { getPosInRange } from '$lib/geo';
import type { Ability } from '$lib/types';

export const blast: Ability = {
	target: 'tile',
	highlight(actor, targetPos, game) {
		const guide = getPosInRange(targetPos, 3, 'euclidean');
		const target = guide.filter((p) => game.at(p).some((e) => e.hp));
		return { guide, hit: target };
	},
	execute(actor, targetPos, game) {
		game.playSfx('explosion');
		for (const pos of this.highlight(actor, targetPos, game).hit) {
			for (const entity of game.at(pos)) {
				actions.damage({ game, target: entity, amount: 3 });
			}
		}
	},
};
