import {
	createApplicationCommand,
	createBot,
	sendInteractionResponse,
	startBot,
	// redisConnect,
	// MongoClient
} from './deps.ts';

import {Match} from './src/Match/Match.ts';
import {MatchManager} from './src/Match/MatchManager.ts';

const token = Deno.env.get('HANGMAN_TOKEN') as string;
const appId = Deno.env.get('HANGMAN_APP_ID') as unknown as bigint;

if (!(token && appId))
	throw "Could not retrieve Token and Application ID. Check your environment variables.";

const matchManager = new MatchManager();

const bot = createBot({
	token: token,
	intents: ['Guilds', 'GuildMessages', 'GuildMessageReactions'],
	botId: appId,
	applicationId: appId,
	events: {
		interactionCreate(bot, interaction) {
			if (!interaction.channelId)
				return;

			if (interaction.data?.name == 'hangman') {
				if (matchManager.hasOngoingMatch(interaction.channelId)) {
					sendInteractionResponse(bot, interaction.id, interaction.token, {
						private: true,
						type: 4,
						data: {content: ':exclamation: There is already an ongoing match in the current channel.'}
					});
					return;
				}

				sendInteractionResponse(bot, interaction.id, interaction.token, {
					private: true,
					type: 4,
					data: {content: "Let's play!"}
				});

				const match = new Match({
					duration: 70,
					bot: bot,
					channelId: interaction.channelId,
					rounds: 3
				});

				matchManager.add(match);

				switch (interaction.data?.options?.[0].name) {
					case 'classic': {
						break;
					}
					case 'custom': {
						break;
					}
					case 'word': {
						break;
					}
				}
			} else {
				sendInteractionResponse(bot, interaction.id, interaction.token, {
					private: true,
					type: 6
				});

				const match = matchManager.get(interaction.channelId);
				if (!match)
					return;

				switch (interaction.data?.customId) {
					case 'clue': {
						match.currentWord()?.requestClue();

						break;
					}
					case 'synonym': {
						match.currentWord()?.requestSynonym();

						break;
					}
					case 'example': {
						match.currentWord()?.requestExample();

						break;
					}
				}
			}
		},
		ready(bot) {
			console.log('Connected');

			createApplicationCommand(bot, {
					description: "HelloLingers' word games!",
					name: 'hangman',
					options: [
						{
							description: '🧍 The classic Hangman we all know and love.',
							name: 'classic',
							type: 1,
						},
						{
							description: '🎓 Guess the whole word at once based on clues.',
							name: 'word',
							type: 1
						},
						{
							description: '🔧 Customize the match the way you like.',
							name: 'custom',
							type: 1,
							options: [
								{
									type: 5,
									description: 'Always give one clue',
									name: 'auto_clue'
								},
								{
									type: 5,
									description: 'Always give one synonym',
									name: 'auto_synonym'
								},
								{
									type: 4,
									description: 'Number of clues allowed',
									name: 'clues'
								},
								{
									type: 4,
									description: 'Number of examples allowed',
									name: 'examples'
								},
								{
									type: 4,
									description: 'Match duration (in minutes)',
									name: 'match_duration'
								},
								{
									type: 4,
									description: 'Number of rounds',
									name: 'rounds'
								},
								{
									type: 4,
									description: 'Round duration (in seconds)',
									name: 'round_duration'
								},
								{
									type: 4,
									description: 'Number of synonyms allowed',
									name: 'synonyms'
								},
								{
									type: 3,
									description: 'Topic 1',
									name: 'topic1',
									choices: [
										{name: '📕 Phrasal verbs', value: 'phrasal_verbs'},
										{name: '🦵 Human body', value: 'human_body'}
									]
								},
								{
									type: 3,
									description: 'Topic 2',
									name: 'topic2',
									choices: [
										{name: '📕 Phrasal verbs', value: 'phrasal_verbs'},
										{name: '🦵 Human body', value: 'human_body'}
									]
								},
								{
									type: 3,
									description: 'Topic 3',
									name: 'topic3',
									choices: [
										{name: '📕 Phrasal verbs', value: 'phrasal_verbs'},
										{name: '🦵 Human body', value: 'human_body'}
									]
								}
							]
						}
					]
				}
			);
		},

		messageCreate(_bot, message) {
			const match = matchManager.get(message.channelId);

			if (!match || !match.currentWord())
				return;

			const msg = message.content.toLowerCase().trim();

			if (msg.length == 1 || msg.length == match.currentWord()?.plain().length) {
				match.currentWord()?.guess(msg);
			}
		}
	}
});

await startBot(bot);

// const client = new MongoClient();
// await client.connect(Deno.env.get('MONGO_URL'));

// const redis = await connect({
// 	hostname: Deno.env.get('REDIS_HOSTNAME'),
// 	port: Deno.env.get('REDIS_PORT')
// });