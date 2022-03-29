import {Discordeno} from './deps.ts';
import * as Env from './env.ts';
import {Match} from './src/match.ts';
import {MatchManager} from './src/match_manager.ts';

const matchManager = new MatchManager();

const bot = Discordeno.createBot({
	token: Env.TOKEN,
	intents: ['Guilds', 'GuildMessages'],
	botId: Env.APP_ID,
	applicationId: Env.APP_ID,
	events: {

		interactionCreate(bot, interaction) {
			if (!interaction.channelId)
				return;

			if (interaction.data?.name == 'hangman') {
				if (matchManager.hasOngoingMatch(interaction.channelId)) {
					Discordeno.sendInteractionResponse(bot, interaction.id, interaction.token, {
						private: true,
						type: 4,
						data: {content: '❗ There is an ongoing match in the current channel.'}
					});
					return;
				}

				Discordeno.sendInteractionResponse(bot, interaction.id, interaction.token, {
					private: true,
					type: 4,
					data: {content: "Let's play!"}
				});

				const match = new Match({
					duration: 300,
					bot: bot,
					channelId: interaction.channelId,
					rounds: 1
				});

				matchManager.add(match);
			} else {
				Discordeno.sendInteractionResponse(bot, interaction.id, interaction.token, {
					private: true,
					type: 6
				});

				const match = matchManager.get(interaction.channelId);
				if (!match)
					return;

				switch (interaction.data?.customId) {
					case 'hint': {
						match.getCurrentRound()?.requestHint();

						break;
					}
					case 'synonym': {
						match.getCurrentRound()?.requestSynonym();

						break;
					}
					case 'example': {
						match.getCurrentRound()?.requestExample();

						break;
					}
				}
			}
		},

		ready(bot) {
			console.log('CONNECTED');

			Discordeno.createApplicationCommand(bot, {
				description: "🎗 Play Hangman by HelloLingers!",
				name: 'hangman'
			}, (Env.GUILD_ID ?? undefined))
		},

		messageCreate(_bot, message) {
			const match = matchManager.get(message.channelId);

			if (!match || !match.getCurrentRound())
				return;

			const msg = message.content.toLowerCase().trim();

			if (msg.length == 1 || msg.length == match.getCurrentRound()?.word.text.length) {
				match.getCurrentRound()?.guess(msg);
			}
		}
	}
});

await Discordeno.startBot(bot);