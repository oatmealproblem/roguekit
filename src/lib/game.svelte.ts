import * as devalue from 'devalue';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { SetRequired } from 'type-fest';

import { playSound, type SoundId } from './audio';
import { aiSystem } from './systems/aiSystem';
import { createFromTemplate } from './templates';
import type { Entity, Pos } from './types';

const GUARANTEED_KEYS = new Set(['id', 'x', 'y']);

type VfxHandler = (vfx: string, pos: Pos) => void;
type SfxHandler = (sfx: SoundId) => void;

export class Game {
	#entities: Map<string, Entity> = new SvelteMap();
	#proxies: Map<Entity, Entity> = new Map();
	#entitiesByPosition: Map<string, Set<Entity>> = new SvelteMap();
	#entitiesByComponent: Map<string, Set<Entity>> = new SvelteMap();
	#vfxHandlers: VfxHandler[] = [];
	#sfxHandlers: SfxHandler[] = [];

	#proxyHandler: ProxyHandler<Entity> = {
		set: (target, key, value) => {
			if (key === 'x' || key === 'y') {
				const oldPosKey = `${target.x},${target.y}`;
				target[key] = value;
				const newPosKey = `${target.x},${target.y}`;
				if (oldPosKey !== newPosKey) {
					this.#entitiesByPosition.get(oldPosKey)?.delete(target);
					if (!this.#entitiesByPosition.has(newPosKey))
						this.#entitiesByPosition.set(newPosKey, new SvelteSet());
					this.#entitiesByPosition.get(newPosKey)?.add(target);
				}
				return true;
			} else if (typeof key === 'string' && !GUARANTEED_KEYS.has(key)) {
				if (value == null) {
					delete target[key as keyof Entity];
					this.#entitiesByComponent.get(key)?.delete(target);
				} else {
					const isNew = !(key in target);
					// @ts-expect-error -- coercing to keyof Entity doesn't work for some reason
					target[key] = value;
					if (isNew) {
						if (!this.#entitiesByComponent.has(key))
							this.#entitiesByComponent.set(key, new SvelteSet());
						this.#entitiesByComponent.get(key)?.add(target);
					}
				}
				return true;
			}
			return false;
		},
		deleteProperty: (target, key) => {
			delete target[key as keyof Entity];
			if (typeof key === 'string' && !GUARANTEED_KEYS.has(key)) {
				this.#entitiesByComponent.get(key)?.delete(target);
			}
			return true;
		},
	};

	add(entity: Entity): Entity {
		const proxy = new Proxy(entity, this.#proxyHandler);
		this.#entities.set(entity.id, entity);
		this.#proxies.set(entity, proxy);
		const posKey = `${entity.x},${entity.y}`;
		if (this.#entitiesByPosition.has(posKey)) {
			this.#entitiesByPosition.get(posKey)?.add(entity);
		} else {
			this.#entitiesByPosition.set(posKey, new SvelteSet([entity]));
		}
		for (const component of Object.keys(entity).filter((key) => !GUARANTEED_KEYS.has(key))) {
			if (this.#entitiesByComponent.has(component)) {
				this.#entitiesByComponent.get(component)?.add(entity);
			} else {
				this.#entitiesByComponent.set(component, new SvelteSet([entity]));
			}
		}
		return proxy;
	}

	remove(entity: Entity) {
		const unproxied = this.#entities.get(entity.id);
		if (unproxied) {
			this.#entities.delete(entity.id);
			this.#proxies.delete(unproxied);
			this.#entitiesByPosition.values().forEach((set) => set.delete(unproxied));
			this.#entitiesByComponent.values().forEach((set) => set.delete(unproxied));
		}
	}

	get_UNPROXIED(id: string) {
		return this.#entities.get(id);
	}
	get(id: string) {
		const entity = this.get_UNPROXIED(id);
		return entity ? this.#proxies.get(entity) : undefined;
	}

	at_UNPROXIED({ x, y }: Pos) {
		return this.#entitiesByPosition.get(`${x},${y}`) ?? new Set();
	}
	at(pos: Pos) {
		return Array.from(this.at_UNPROXIED(pos)).map((entity) => this.#proxies.get(entity)!);
	}

	with_UNPROXIED<T extends keyof Omit<Entity, 'id' | 'x' | 'y'>>(...components: [T, ...T[]]) {
		const [first, ...rest] = components;
		let result = this.#entitiesByComponent.get(first) ?? new Set();
		for (const comp of rest) {
			result = result.intersection(this.#entitiesByComponent.get(comp) ?? new Set());
		}
		return result as unknown as Set<SetRequired<Entity, T>>;
	}
	with<T extends keyof Omit<Entity, 'id' | 'x' | 'y'>>(...components: [T, ...T[]]) {
		return Array.from(this.with_UNPROXIED(...components)).map(
			(entity) => this.#proxies.get(entity as unknown as Entity)!,
		) as unknown as SetRequired<Entity, T>[];
	}

	registerVfxHandler(handler: VfxHandler): () => void {
		this.#vfxHandlers.push(handler);
		const unregister = () => {
			this.#vfxHandlers.splice(this.#vfxHandlers.indexOf(handler), 1);
		};
		return unregister;
	}

	playVfx(vfx: string, pos: Pos) {
		this.#vfxHandlers.forEach((handler) => handler(vfx, pos));
	}

	registerSfxHandler(handler: SfxHandler): () => void {
		this.#sfxHandlers.push(handler);
		const unregister = () => {
			this.#sfxHandlers.splice(this.#sfxHandlers.indexOf(handler), 1);
		};
		return unregister;
	}

	playSfx(sfx: SoundId) {
		this.#sfxHandlers.forEach((handler) => handler(sfx));
	}

	processTurn() {
		aiSystem(this);
		this.save();
	}

	save() {
		localStorage.setItem('game', devalue.stringify(this.#entities));
	}

	reset() {
		this.#entities.clear();
		this.#proxies.clear();
		this.#entitiesByPosition.clear();
		this.#entitiesByComponent.clear();
	}

	load() {
		this.reset();
		const saved = localStorage.getItem('game');
		if (saved) {
			const savedEntities = devalue.parse(saved) as Map<string, Entity>;
			for (const savedEntity of savedEntities.values()) {
				const entity = $state(savedEntity);
				this.add(entity);
			}
		}
	}
}

export const game = new Game();
game.load();
game.registerSfxHandler(playSound);

export function initGame() {
	game.reset();

	const player = $state<Entity>({
		id: 'player',
		x: 0,
		y: 0,
		player: true,
		team: 'player',
		attack: { damage: 2 },
		glyph: { char: '@', color: 'white' },
		hp: { current: 10, max: 10 },
	});
	game.add(player);

	const goblin = $state<Entity>(createFromTemplate('goblin', { x: 10, y: 10 }));
	game.add(goblin);

	const goblin2 = $state<Entity>(createFromTemplate('goblin', { x: 15, y: 20 }));
	game.add(goblin2);
}
