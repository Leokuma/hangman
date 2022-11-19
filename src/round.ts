import {Discordeno} from '../deps.ts';
import {Word} from './word.ts';

export interface RoundConfig {
	autoHints?: number;
	bot: Discordeno.Bot;
	channelId: bigint;
	/** In seconds. */
	duration?: number;
	examplesAllowed?: number;
	hintsAllowed?: number;
	synonymsAllowed?: number;
	word: Word;
}

export class Round {
	static #LETTER_WILDCARD = '?';
	#hintsRequested = 0;
	#config: RoundConfig;
	#examplesRequested = 0;
	#finished = false;
	#guesses = new Set<string>();
	#secondsElapsed = 0;
	#started = false;
	#synonymsRequested = 0;
	#ticId: number | undefined;
	/** In seconds */
	#ticStep = 1;

	constructor(config: RoundConfig) {
		this.#config = config;
		this.#hintsRequested = (this.#config.autoHints || 0);
	}

	finish(): boolean {
		if (this.#finished)
			return false;

		clearInterval(this.#ticId);
		this.#finished = true;
		this.onFinish();

		return true;
	}

	guess(letterOrWord: string): boolean {
		letterOrWord = letterOrWord.trim().toLowerCase().replaceAll(/[^\a-z|\s]/g, '');

		if (!letterOrWord.length || this.#guesses.has(letterOrWord)) {
			return false;
		}

		this.#guesses.add(letterOrWord);

		let found: boolean;

		if (letterOrWord.length == 1)
			found = (this.word.text.includes(letterOrWord));
		else
			found = (this.word.text == letterOrWord);

		if (found && !this.wildcarded().includes(Round.#LETTER_WILDCARD)) {
			this.finish();
			this.postUpdate(true);
		} else {
			this.postUpdate();
		}

		return found;
	}

	guessed(letterOrWord?: string): boolean {
		if (!letterOrWord)
			return !this.wildcarded().includes(Round.#LETTER_WILDCARD);

		return this.#guesses.has(letterOrWord.trim().toLowerCase());
	}

	missguesses(): string[] {
		return [...this.#guesses].filter(guess => !this.word.text.includes(guess));
	}

	/** @todo Declare as TypeScript callback. */
	onFinish() {}

	/** @todo Declare as TypeScript callback. */
	onTime(secondsElapsed: number, secondsLeft: number) {
		if (secondsLeft == 10)
			Discordeno.sendMessage(this.#config.bot, this.#config.channelId, {
				content: 'Only 10 seconds left!'
			});
	}

	postUpdate(reveal = false) {
		let word = '';
		if (reveal) {
			word = this.word.text
				.replaceAll(/(\S)/g, `:regional_indicator_$1:`)
				.replaceAll(' ', ':heavy_minus_sign:')
				.replaceAll('::', ': :')
				+ '.';
		} else {
			word = this.wildcarded()
				.replaceAll(new RegExp(`([^${Round.#LETTER_WILDCARD}\\s])`, 'g'), `:regional_indicator_$1:`)
				.replaceAll(' ', ':heavy_minus_sign:')
				.replaceAll(Round.#LETTER_WILDCARD, ':blue_square:')
				.replaceAll('::', ': :')
				+ '.';
		}

		const msg: Discordeno.CreateMessage = {
			embeds: [{
				description: word,
				color: 0x132F44,
				fields: []
			}]
		};

		const wordRegex = new RegExp(this.word.text, 'gi');
		const inflectionsRegex = new RegExp(this.word.inflections.join('|'), 'gi');

		/** @todo Refactor this whole ugly `if` chain below. Make the `___allowed` properties to always have a value */

		if (!reveal && this.#config.hintsAllowed && this.#hintsRequested && this.word.hints.length) {
			msg.embeds?.[0].fields?.push(...this.word.hints
				.filter((_, i) => (i < this.#hintsRequested))
				.map((hint, i) => ({
					name: `Hint ${i + 1}`,
					value: hint
						.replaceAll(wordRegex, '`' + [...this.wildcarded().replaceAll(Round.#LETTER_WILDCARD, '_')].join('') + '`')
						.replaceAll(inflectionsRegex, (str) => '`' + str.replaceAll(/\w/g, '_') + '`')
				}))
			);
		}

		if (!reveal && this.#config.synonymsAllowed && this.#synonymsRequested && this.word.synonyms.length) {
			msg.embeds?.[0].fields?.push({
				name: 'Synonyms',
				value: this.word.synonyms
					.filter((_, i) => (i < this.#synonymsRequested))
					.join(', ') + '.'
			});
		}

		if (!reveal && this.#config.examplesAllowed && this.#examplesRequested && this.word.examples.length) {
			msg.embeds?.[0].fields?.push(...this.word.examples
				.filter((_, i) => (i < this.#examplesRequested))
				.map((example, i) => ({
					name: `Example ${i + 1}`,
					value: example
						.replaceAll(wordRegex, '`' + [...this.wildcarded().replaceAll(Round.#LETTER_WILDCARD, '_')].join('') + '`')
						.replaceAll(inflectionsRegex, (str) => '`' + str.replaceAll(/\w/g, '_') + '`')
				}))
			);
		}

		if (!reveal && this.#config.hintsAllowed && (this.#config.hintsAllowed > this.#hintsRequested) && (this.#hintsRequested < this.word.hints.length)) {
			if (!msg.components) {
				msg.components = [{
					type: 1,
					components: [{
						customId: 'hint',
						disabled: false,
						emoji: {name: '🔍'},
						label: 'Hint',
						style: 1,
						type: 2
					}]
				}]
			} else {
				msg.components[0].components.push({
					customId: 'hint',
					disabled: false,
					emoji: {name: '🔍'},
					label: 'Hint',
					style: 1,
					type: 2
				})
			}
		}

		if (!reveal && this.#config.synonymsAllowed && (this.#config.synonymsAllowed > this.#synonymsRequested) && (this.#synonymsRequested < this.word.synonyms.length)) {
			if (!msg.components) {
				msg.components = [{
					type: 1,
					components: [{
						style: 1,
						label: 'Synonym',
						customId: 'synonym',
						disabled: false,
						type: 2
					}]
				}]
			} else {
				msg.components[0].components.push({
					style: 1,
					label: 'Synonym',
					customId: 'synonym',
					disabled: false,
					type: 2
				})
			}
		}

		if (!reveal && this.#config.examplesAllowed && (this.#config.examplesAllowed > this.#examplesRequested) && (this.#examplesRequested < this.word.examples.length)) {
			if (!msg.components) {
				msg.components = [{
					type: 1,
					components: [{
						customId: 'example',
						disabled: false,
						emoji: {
							name: '🗨️'
						},
						label: 'Example',
						style: 1,
						type: 2
					}]
				}]
			} else {
				msg.components[0].components.push({
					customId: 'example',
					disabled: false,
					emoji: {
						name: '🗨️'
					},
					label: 'Example',
					style: 1,
					type: 2
				})
			}
		}

		if (!reveal) {
			const missguesses = this.missguesses();
			if (missguesses.length) {
				if (msg.embeds && msg.embeds.length && !msg.embeds[0].footer) {
					msg.embeds[0].footer = {
						text: '❌ ' + missguesses.join(', ').toUpperCase()
					};
				}
			}
		}

		Discordeno.sendMessage(this.#config.bot, this.#config.channelId, msg);
	}

	requestHint() {
		if (this.#config.hintsAllowed && (this.#config.hintsAllowed > this.#hintsRequested)) {
			this.#hintsRequested++;
			this.postUpdate();
		}
	}

	requestExample() {
		if (this.#config.examplesAllowed && (this.#config.examplesAllowed > this.#examplesRequested)) {
			this.#examplesRequested++;
			this.postUpdate();
		}
	}

	requestSynonym() {
		if (this.#config.synonymsAllowed && (this.#config.synonymsAllowed > this.#synonymsRequested)) {
			this.#synonymsRequested++;
			this.postUpdate();
		}
	}

	start(): boolean {
		this.postUpdate();

		this.#started = true;

		if (this.#config.duration)
			setTimeout(this.#tic.bind(this), this.#ticStep * 1000);

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
		// ⏱
		Discordeno.sendMessage(this.#config.bot, this.#config.channelId, {
			content: 'Time is up!'
		});

		this.postUpdate(true);

		this.finish();
	}

	wildcarded(): string {
		if (this.#guesses.has(this.word.text))
			return this.word.text;
		else
			return [...this.word.text]
				.map(letter => (letter == ' ' || this.guessed(letter)) ? letter : Round.#LETTER_WILDCARD)
				.join('');
	}

	get bot(): RoundConfig['bot'] {
		return this.#config.bot;
	}

	get channelId(): RoundConfig['channelId'] {
		return this.#config.channelId;
	}

	get duration(): number | undefined {
		return this.#config.duration;
	}

	get secondsElapsed(): number {
		return this.#secondsElapsed;
	}

	get word(): Word {
		return this.#config.word;
	}
}