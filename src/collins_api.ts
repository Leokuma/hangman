import {DenoDOM} from '../deps.ts';
import * as Env from '../env.ts';

export interface Search {
	currentPageIndex: number;
	dictionaryCode: string;
	pageNumber: number;
	resultNumber: number;
	results: {
		entryLabel: string,
		entryUrl: string,
		entryId: string
	}[];
}

export function search(word: string): Promise<Search> {
	return fetch(Env.COLLINS_URL + 'search?limit=5&q=' + word, {
		headers: {
			accessKey: Env.COLLINS_KEY,
			host: 'https://discord.com/channels/569460123546681356/569885521522851840' /** @todo make it dynamic */
		}
	}).then(res => res.json());
}

export interface Entry {
	dictionaryCode: string;
	entryContent: DenoDOM.HTMLDocument;
	entryId: string;
	entryLabel: string;
	entryUrl: string;
	format: string;
	topics: string[];
}

export async function getEntry(id: string): Promise<Entry> {
	const res = await fetch(Env.COLLINS_URL + 'entries/' + id + '/?format=xml', {
		headers: {
			accessKey: Env.COLLINS_KEY,
			host: 'https://discord.com/channels/569460123546681356/569885521522851840' /** @todo make it dynamic */
		}
	}).then(res => res.json());

	res.entryContent = (new DenoDOM.DOMParser()).parseFromString(res.entryContent, 'text/html');
	return res;
}