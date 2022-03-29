import * as API from './collins_api.ts';
import type {Word} from './word.ts';

export async function getEntry(id: string): Promise<Word | null> {
	const entry = await API.getEntry(id);

	const hints = [...entry.entryContent.querySelectorAll('def')].map(def => def.textContent);
	const examples = [...entry.entryContent.querySelectorAll('quote')].map(quote => quote.textContent);
	const inflections = [...new Set([...entry.entryContent.querySelectorAll('orth')].map(orth => orth.textContent))];

	const wordTag = entry.entryContent.querySelector('orth');
	wordTag?.children[0]?.remove();

	const text = wordTag?.textContent;

	if (text)
		return {hints, examples, inflections, synonyms: [], text};
	else
		return null;
}

export async function getRandomEntryFromSearch(word: string): Promise<Word | null> {
	word = word.toLowerCase();
	const wordRegex = new RegExp('^' + word + '_\d$');

	const search = await searchEntries(word);

	const relevants = search.results.filter(result => wordRegex.test(result.entryId));

	let resultIndex = 0;
	if (relevants.length > 1) {
		let weights: number[];

		switch (relevants.length) {
			case 2: weights = [5, 1]; break;
			case 3: weights = [10, 2, 1]; break;
			default: weights = [20, 5, 3, 1]; break;
		}

		resultIndex = weightedRandom(weights);
	}

	return await getEntry(search.results[resultIndex].entryId);
}

export async function searchEntries(word: string): Promise<API.Search> {
	return await API.search(word);
}

function weightedRandom(weights: number[]): number {
	const sum = weights.reduce((acc, cur) => (acc + cur));
	const random = Math.floor(Math.random() * sum) + 1;

	let i = 0, acc = weights[0];
	while (random > acc)
		acc += weights[++i];

	return i;
}