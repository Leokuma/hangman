import {Match} from './Match.ts';
import type {MatchConfig} from './MatchConfig.ts';
import {sendMessage} from '../../deps.ts';

export class MatchManager {
	/** Cached ongoing matches. */
	#matches: Map<MatchConfig['channelId'], Match>;


	constructor() {
		this.#matches = new Map();
	}

	add(match: Match): boolean {
		if (this.hasOngoingMatch(match.channelId)) {
			sendMessage(match.bot, match.channelId, {
				content: ':exclamation: There is already an ongoing match in the current channel.'
			});

			return false;
		}

		this.#matches.set(match.channelId, match);

		match.onFinish = () => this.#matches.delete(match.channelId);

		return match.start();
	}

	get(channelId: bigint): Match | undefined {
		return this.#matches.get(channelId);
	}

	delete(channelId: bigint): boolean {
		return this.#matches.delete(channelId);
	}

	hasOngoingMatch(channelId: MatchConfig['channelId']): boolean {
		return !!this.#matches.get(channelId);
	}
}