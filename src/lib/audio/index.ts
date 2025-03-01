import { Howl } from 'howler';

import explosion from './explosionCrunch_000.webm';
import footstep from './footstep_grass_000.webm';
import knifeSlice from './knifeSlice.webm';
import laser from './laserSmall_000.webm';

const soundUrls = {
	explosion,
	footstep,
	knifeSlice,
	laser,
};

export type SoundId = keyof typeof soundUrls;

const sounds = Object.fromEntries(
	Object.entries(soundUrls)
		.map<[string, Howl]>(([key, val]) => [key, new Howl({ src: val })])
		.map<[string, () => void]>(([key, val]) => [key, throttle(() => val.play(), 100)]),
);

export function playSound(sound: SoundId) {
	sounds[sound]?.();
}

function throttle<Args extends unknown[]>(
	func: (...args: Args) => void,
	delay: number,
): (...args: Args) => void {
	let timerId: number | undefined;

	return (...args: Args) => {
		if (!timerId) {
			func(...args);
		}
		timerId = setTimeout(() => {
			timerId = undefined;
		}, delay);
	};
}
