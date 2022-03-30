import * as Env from '../env.ts';
import {Mongo, Redis} from '../deps.ts';

export async function updateChannels(): Promise<Redis.RedisReplyOrError[]> {
	const mongo = new Mongo.MongoClient();
	await mongo.connect(Env.Mongo.CONNECT_OPTIONS);
	const channels = await mongo.database('hangman').collection('channels').find({status: 1}).toArray();
	mongo.close();

	const redis = await Redis.connect(Env.Redis.CONNECT_OPTIONS);
	const pipeline = redis.tx();
	pipeline.del('channels');
	if (channels.length)
		pipeline.sadd('channels', ...channels.map(channel => channel.id))
	const ret = await pipeline.flush();
	redis.close();

	return ret;
}

export async function getRandomWords(n = 1): Promise<string[]> {
	const redis = await Redis.connect(Env.Redis.CONNECT_OPTIONS);
	const words = await redis.srandmember('words', n);
	redis.close();

	return words;
}

export async function updateWords() {
	const mongo = new Mongo.MongoClient();
	await mongo.connect(Env.Mongo.CONNECT_OPTIONS);
	const words = await mongo.database('hangman').collection('words').find({disabled: {$not: {$eq: true}}}, {projection: {word: 1}}).toArray();
	mongo.close();

	const redis = await Redis.connect(Env.Redis.CONNECT_OPTIONS);
	const pipeline = redis.tx();
	pipeline.del('words');
	if (words.length)
		pipeline.sadd('words', ...words.map(word => word.word))
	const ret = await pipeline.flush();
	redis.close();

	return ret;
}