import { writable } from 'svelte/store';

export const concepts = writable([]);
export const conceptsMap = writable([]);

export const mapShown = writable(false);

export const selectedConcept = writable(null);

export const selectConcept = (item) => {
	selectedConcept.set(item);
};

export const goHome = () => {
	selectedConcept.set(null);
};

export const chapters = writable([]);
export const chaptersMap = writable([]);

export const selectedChapter = writable(null);

export const selectChapter = (item) => {
	selectedChapter.set(item);
};

