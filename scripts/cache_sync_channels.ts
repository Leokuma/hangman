import * as Env from '../env.ts';
import {Mongo, Redis} from '../deps.ts';

const mongo = new Mongo.MongoClient();
await mongo.connect(Env.Mongo.CONNECT_OPTIONS);
const channels = await mongo.database('hangman').collection('channels').find({status: 1}).toArray();
mongo.close();

const redis = await Redis.connect(Env.Redis.CONNECT_OPTIONS);
const pipeline = redis.tx();
pipeline.del('channels');
if (channels.length)
	pipeline.sadd('channels', ...channels.map(channel => channel.id))

await pipeline.flush();

redis.close();