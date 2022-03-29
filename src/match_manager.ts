import {Discordeno} from '../deps.ts';
import {Match, MatchConfig} from './match.ts';

export class MatchManager {
	/** Cached ongoing matches. */
	#matches: Map<MatchConfig['channelId'], Match>;

	constructor() {
		this.#matches = new Map();
	}

	async add(match: Match): Promise<boolean> {
		if (this.hasOngoingMatch(match.channelId)) {
			Discordeno.sendMessage(match.bot, match.channelId, {
				content: '❗ There is already an ongoing match in this current channel.'
			});

			return false;
		}

		this.#matches.set(match.channelId, match);

		match.onFinish = () => this.#matches.delete(match.channelId);

		return await match.start();
	}

	get(channelId: bigint): Match | undefined {
		return this.#matches.get(channelId);
	}

	delete(channelId: bigint): boolean {
		return this.#matches.delete(channelId);
	}

	hasOngoingMatch(channelId: MatchConfig['channelId']): boolean {
		return this.#matches.has(channelId);
	}
}