import actions from '$lib/actions';
import { getRay } from '$lib/geo';
import type { Ability } from '$lib/types';

export const laser: Ability = {
	target: 'tile',
	highlight(actor, targetPos, game) {
		const guide = getRay(actor, targetPos);
		const target = guide.slice(1).filter((pos) => game.at(pos).some((e) => e.hp));
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
