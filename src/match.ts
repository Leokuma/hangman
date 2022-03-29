import {Discordeno} from '../deps.ts';
import {getRandomWords} from './cache.ts';
import {getRandomEntryFromSearch} from './collins.ts';
import {Round} from './round.ts';

export interface MatchConfig {
	bot: Discordeno.Bot;
	channelId: bigint;
	/** In seconds. */
	duration?: number;
	rounds: number;
}

export class Match {
	/** @todo Should have Hints, Synonyms and Examples here as well, in addition to the ones already present in Round */

	#config: MatchConfig;
	#currentRound = 0;
	#finished = false;
	#isReady = false;
	#secondsElapsed = 0;
	#started = false;
	#ticId: number | undefined;
	/** In seconds */
	#ticStep = 1;
	#rounds: Round[] = [];

	constructor(config: MatchConfig) {
		this.#config = config;
	}

	getCurrentRound(): Round | undefined {
		return this.#rounds[this.#currentRound];
	}

	finish(): boolean {
		if (this.#finished)
			return false;

		this.#finished = true;

		clearInterval(this.#ticId);

		this.getCurrentRound()?.finish();

		this.onFinish();

		return true;
	}

	/** @todo Declare as TypeScript callback. */
	onFinish() {}

	/** @todo Declare as TypeScript callback. */
	onTime(secondsElapsed: number, secondsLeft: number) {}

	async start(): Promise<boolean> {
		const wordStrs = await getRandomWords(this.#config.rounds);

		for (const str of wordStrs) {
			const word = await getRandomEntryFromSearch(str);

			if (!word)
				continue;

			const round = new Round({
				bot: this.#config.bot,
				channelId: this.#config.channelId,
				hintsAllowed: 10,
				duration: 120,
				examplesAllowed: 10,
				synonymsAllowed: 10,
				word: word
			});

			/** @todo Possibly allow creating Round with callbacks defined directly in `config` */
			/** @todo Pass in a method instead of a lambda to prevent creating a new function for every word */
			round.onFinish = () => {
				if (this.#currentRound < (this.#rounds.length - 1)) {
					this.#currentRound++;
					this.#rounds[this.#currentRound].start();
				} else {
					this.finish();
				}
			}

			this.#rounds.push(round);
		}

		if (!this.getCurrentRound())
			return false;

		this.getCurrentRound()?.start();

		this.#started = true;

		if (this.#config.duration)
			this.#tic();

		return true;
	}

	#tic() {
		this.#secondsElapsed += this.#ticStep;

		if (this.#config.duration) {
			if (this.#secondsElapsed == this.#config.duration) {
				this.timeUp();
			} else {
				this.onTime(this.#secondsElapsed, this.#config.duration - this.#secondsElapsed);
				this.#ticId = setTimeout(this.#tic.bind(this), this.#ticStep * 1000);
			}
		}
	}

	timeUp() {
		this.getCurrentRound()?.timeUp();
		this.finish();
	}

	get bot(): MatchConfig['bot'] {
		return this.#config.bot;
	}

	get channelId(): MatchConfig['channelId'] {
		return this.#config.channelId;
	}

	get secondsElapsed(): number {
		return this.#secondsElapsed;
	}
}