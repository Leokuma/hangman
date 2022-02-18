import type {Bot} from '../../deps.ts';

export interface WordConfig {
	bot: Bot;
	channelId: bigint;
	cluesAllowed?: number;
	/** In seconds. */
	duration?: number;
	examplesAllowed?: number;
	synonymsAllowed?: number;
}