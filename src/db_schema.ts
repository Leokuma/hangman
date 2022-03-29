import {Mongo} from '../deps.ts';
import * as Env from '../env.ts';

export async function setUp() {
	const ops = [];
	const mongo = new Mongo.MongoClient();
	await mongo.connect(Env.Mongo.CONNECT_OPTIONS);

	ops.push(
		mongo.database('hangman').collection('channels').createIndexes({
			indexes: [
				{name: 'status_asc', key: {status: 1}},
				{name: 'channel_uq', key: {channel: 1}, unique: true}
			]
		})
	);

	ops.push(
		mongo.database('hangman').collection('words').createIndexes({
			indexes: [
				{name: 'word_uq', key: {word: 1}, unique: true}
			]
		})
	);

	return await Promise.all(ops);
}