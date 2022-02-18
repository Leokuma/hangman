import type {Bot} from '../../deps.ts';

export interface MatchConfig {
	bot: Bot;
	channelId: bigint;
	/** In seconds. */
	duration?: number;
	rounds: number;
}