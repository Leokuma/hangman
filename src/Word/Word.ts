import type {CreateMessage} from '../../deps.ts';
import type {WordConfig} from './WordConfig.ts';
import {sendMessage} from '../../deps.ts';

export class Word {
	static wildcard = '?';

	#clues: string[] = [];
	#cluesRequested = 0;
	#config: WordConfig;
	#examples: string[] = [];
	#examplesRequested = 0; /** @todo Possibly move these variables into `options` */
	#finished = false;
	#guesses = new Set<string>();
	#secondsElapsed = 0;
	#started = false;
	#synonymsRequested = 0;
	#synonyms: string[] = [];
	#ticId: number | undefined;
	/** In seconds */
	#ticStep = 1;
	#word = '';

	get bot(): WordConfig['bot'] {
		return this.#config.bot;
	}

	get channelId(): WordConfig['channelId'] {
		return this.#config.channelId;
	}

	constructor(config: WordConfig) {
		this.#config = config;

		const wordList = [
			{
				word: 'flattered',
				clues: [
					'If you are flattered by something that has happened, you are pleased about it because it makes you feel important or special. ',
					'People sometimes use "flattered" when they are expressing thanks in formal situations. '
				],
				synonyms:	['pleased', 'delighted', 'honoured', 'gratified'],
				examples: [" She was flattered by Roberto's long letter. ",
					"I am flattered that they should be so supportive."
				]
			},
			{
				word: 'pedantic',
				clues: [
					'If you think someone is pedantic, you mean that they are too concerned with unimportant details or traditional rules, especially in connection with academic subjects. '
				],
				synonyms:	['academic', 'pompous', 'schoolmasterly', 'stilted'],
				examples: ['His lecture was so pedantic and uninteresting.']
			},
			{
				word: 'compelling',
				clues: [
					'A compelling argument or reason is one that convinces you that something is true or that something should be done. ',
					"If you describe something such as a film or book, or someone's appearance, as compelling, you mean you want to keep looking at it or reading it because you find it so interesting. "
				],
				synonyms: ['fascinating', 'gripping', 'irresistible', 'enchanting'],
				examples: [
					'A compelling answer was provided in the final session from two different sources.',
					'There was no longer any compelling reason to continue this line of investigation.'
				]
			},
			{
				word: 'win',
				clues: [
					'If you win something such as a competition, battle, or argument, you defeat those people you are competing or fighting against, or you do better than everyone else involved. '
				],
				synonyms: ['be victorious in', 'succeed in', 'prevail in', 'come first in'],
				examples: [
					'He does not have any realistic chance of winning the election.',
					'The NCAA basketball championship was won by North Carolina.',
					'...when Napoleon was winning his great battles in Italy.',
					'The top four teams all won',
					'Konta won 2–6, 6–4, 6–3.'
				]
			},
			{
				word: 'flat',
				clues: [
					'A flat is a set of rooms for living in, usually on one floor and part of a larger building. A flat usually includes a kitchen and bathroom. ',
					'Something that is flat is level, smooth, or even, rather than sloping, curved, or uneven. ',
					'Flat means horizontal and not upright. ',
					'A flat object is not very tall or deep in relation to its length and width. ',
					'Flat land is level, with no high hills or other raised parts. '
				],
				synonyms: ['apartment [mainly US]', 'rooms', 'quarters', 'digs', 'horizontal', 'prone', 'outstretched', 'reclining', 'evenness', 'uniformity', 'smoothness', 'horizontality'],
				examples: [
					'Sara lives with her partner and children in a flat in central London.',
					'...a block of flats',
					'Later on, Victor from flat 10 called.',
					"Tiles can be fixed to any surface as long as it's flat, firm and dry.",
					'After a moment his right hand moved across the cloth, smoothing it flat.',
					'...windows which a thief can reach from a drainpipe or flat roof.',
					'The sea was calm, perfectly flat.',
					" Two men near him threw themselves flat. As heartburn is usually worse when you're lying down, you should avoid lying flat.",
					"Ellen is walking down the drive with a square flat box balanced on one hand.",
				]
			}
		];

		const randomWord = wordList[+Math.floor(Math.random() * 4.9)];

		this.#clues = randomWord.clues;
		this.#examples = randomWord.examples;
		this.#synonyms = randomWord.synonyms;
		this.#word = randomWord.word;
	}

	get duration(): number | undefined {
		return this.#config.duration;
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

		if (letterOrWord.length == 1) {
			found = (this.#word.includes(letterOrWord));
		} else {
			found = (this.#word == letterOrWord);
		}

		if (found && !this.wildcarded().includes(Word.wildcard))
			this.finish();

		this.post();

		return found;
	}

	guessed(letterOrWord?: string): boolean {
		if (!letterOrWord)
			return !this.wildcarded().includes(Word.wildcard);

		return this.#guesses.has(letterOrWord.trim().toLowerCase());
	}

	missguesses(): string[] {
		return [...this.#guesses].filter(guess => (guess != this.#word && !this.#word.includes(guess)));
	}

	/** @todo Declare as TypeScript callback. */
	onFinish() {}

	/** @todo Declare as TypeScript callback. */
	onTime(secondsElapsed: number, secondsLeft: number) {
		if (secondsLeft == 5)
			sendMessage(this.#config.bot, this.#config.channelId, {
				content: 'Only 5 seconds left!'
			});
	}

	get plain(): string {
		return this.#word;
	}

	post(reveal = false) {
		let word = '';
		if (reveal) {
			word = this.plain
				.replaceAll(/(\S)/g, `:regional_indicator_$1:`)
				.replaceAll(' ', ':heavy_minus_sign:')
				.replaceAll('::', ': :')
				+ '.';
		} else {
			word = this.wildcarded()
				.replaceAll(new RegExp(`([^${Word.wildcard}\\s])`, 'g'), `:regional_indicator_$1:`)
				.replaceAll(' ', ':heavy_minus_sign:')
				.replaceAll(Word.wildcard, ':blue_square:')
				.replaceAll('::', ': :')
				+ '.';
		}

		const msg: CreateMessage = {
			embeds: [{
				description: word,
				color: 0x132F44,
				fields: []
			}]
		};

		/** @todo Refactor this whole ugly `if` chain. Make the `___allowed` properties to always have a value */

		if (this.#config.cluesAllowed && this.#cluesRequested && this.#clues.length) {
			msg.embeds?.[0].fields?.push(...this.#clues
				.filter((_, i) => (i < this.#cluesRequested))
				.map((clue, i) => ({name: `Clue ${i + 1}`, value: clue.replaceAll(this.#word, '`' + [...this.wildcarded().replaceAll(Word.wildcard, '_')].join('') + '`')}))
			);
		}

		if (this.#config.synonymsAllowed && this.#synonymsRequested && this.#synonyms.length) {
			msg.embeds?.[0].fields?.push({
				name: 'Synonyms',
				value: this.#synonyms
					.filter((_, i) => (i < this.#synonymsRequested))
					.join(', ') + '.'
			});
		}

		if (this.#config.examplesAllowed && this.#examplesRequested && this.#examples.length) {
			msg.embeds?.[0].fields?.push(...this.#examples
				.filter((_, i) => (i < this.#examplesRequested))
				.map((example, i) => ({name: `Example ${i + 1}`, value: example.replaceAll(this.#word, '`' + [...this.wildcarded().replaceAll(Word.wildcard, '_')].join('') + '`')}))
			);
		}

		if (this.#config.cluesAllowed && (this.#config.cluesAllowed > this.#cluesRequested) && (this.#cluesRequested < this.#clues.length)) {
			if (!msg.components) {
				msg.components = [{
					type: 1,
					components: [{
						style: 1,
						label: 'Clue',
						customId: 'clue',
						disabled: false,
						type: 2
					}]
				}]
			} else {
				msg.components[0].components.push({
					style: 1,
					label: 'Clue',
					customId: 'clue',
					disabled: false,
					type: 2
				})
			}
		}

		if (this.#config.synonymsAllowed && (this.#config.synonymsAllowed > this.#synonymsRequested) && (this.#synonymsRequested < this.#synonyms.length)) {
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

		if (this.#config.examplesAllowed && (this.#config.examplesAllowed > this.#examplesRequested) && (this.#examplesRequested < this.#examples.length)) {
			if (!msg.components) {
				msg.components = [{
					type: 1,
					components: [{
						style: 1,
						label: 'Example',
						customId: 'example',
						disabled: false,
						type: 2
					}]
				}]
			} else {
				msg.components[0].components.push({
					style: 1,
					label: 'Example',
					customId: 'example',
					disabled: false,
					type: 2
				})
			}
		}

		const missguesses = this.missguesses();
		if (missguesses.length) {
			if (msg.embeds && msg.embeds.length && !msg.embeds[0].footer) {
				msg.embeds[0].footer = {
					text: '❌ ' + missguesses.join(', ').toUpperCase()
				};
			}
		}

		sendMessage(this.#config.bot, this.#config.channelId, msg);
	}

	requestClue() {
		if (this.#config.cluesAllowed && (this.#config.cluesAllowed > this.#cluesRequested)) {
			this.#cluesRequested++;
			this.post();
		}
	}

	requestExample() {
		if (this.#config.examplesAllowed && (this.#config.examplesAllowed > this.#examplesRequested)) {
			this.#examplesRequested++;
			this.post();
		}
	}

	requestSynonym() {
		if (this.#config.synonymsAllowed && (this.#config.synonymsAllowed > this.#synonymsRequested)) {
			this.#synonymsRequested++;
			this.post();
		}
	}

	start(): boolean {
		this.post();

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
		sendMessage(this.#config.bot, this.#config.channelId, {
			content: 'Time is up!'
		});

		this.post(true);

		this.finish();
	}

	get secondsElapsed(): number {
		return this.#secondsElapsed;
	}

	wildcarded(): string {
		if (this.#guesses.has(this.#word))
			return this.#word;
		else
			return [...this.#word]
				.map(letter => (letter == ' ' || this.guessed(letter)) ? letter : Word.wildcard)
				.join('');
	}
}