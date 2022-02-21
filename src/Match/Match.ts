import type {MatchConfig} from './MatchConfig.ts';
import {sendMessage} from '../../deps.ts';
import {Word} from '../Word/Word.ts';

export class Match {
	/** @todo Needs to have Clues, Synonyms and Examples here as well, in addition to the ones already present in Word */

	#config: MatchConfig;
	#currentWord = 0;
	#finished = false;
	#secondsElapsed = 0;
	#started = false;
	#ticId: number | undefined;
	/** In seconds */
	#ticStep = 1;
	#words: Word[] = [];

	get bot(): MatchConfig['bot'] {
		return this.#config.bot;
	}

	get channelId(): MatchConfig['channelId'] {
		return this.#config.channelId;
	}

	constructor(config: MatchConfig) {
		this.#config = config;

		let rounds = this.#config.rounds;

		while (rounds--) {
			const word = new Word({
				bot: config.bot,
				channelId: config.channelId,
				cluesAllowed: 10,
				duration: 30,
				examplesAllowed: 10,
				synonymsAllowed: 10
			});

			/** @todo Possibly allow creating Word with callbacks defined directly in `config` */
			/** @todo Pass in a method instead of a lambda to prevent creating a new function for every word */
			word.onFinish = () => {
				if (this.#currentWord < (this.#words.length - 1)) {
					this.#currentWord++;
					this.#words[this.#currentWord].start();
				} else {
					this.finish();
				}
			}

			this.#words.push(word);
		}
	}

	get currentWord(): Word | undefined {
		return this.#words[this.#currentWord];
	}

	finish(): boolean {
		if (this.#finished)
			return false;

		this.#finished = true;

		clearInterval(this.#ticId);

		this.currentWord?.finish();

		this.onFinish();

		return true;
	}

	/** @todo Declare as TypeScript callback. */
	onFinish() {}

	/** @todo Declare as TypeScript callback. */
	onTime(secondsElapsed: number, secondsLeft: number) {}

	start(): boolean {
		if (!this.currentWord)
			return false;

		this.currentWord.start();

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
		this.currentWord?.timeUp();
		this.finish();
	}

	get secondsElapsed(): number {
		return this.#secondsElapsed;
	}
}