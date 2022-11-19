import * as Env from '../env.ts';
import {Mongo, Redis} from '../deps.ts';

const mongo = new Mongo.MongoClient();
await mongo.connect(Env.Mongo.CONNECT_OPTIONS);
const words = await mongo.database('hangman').collection('words').find({disabled: {$not: {$eq: true}}}, {projection: {word: 1}}).toArray();
mongo.close();

const redis = await Redis.connect(Env.Redis.CONNECT_OPTIONS);
const pipeline = redis.tx();
pipeline.del('words');
if (words.length)
	pipeline.sadd('words', ...words.map(word => word.word))

await pipeline.flush();

redis.close();