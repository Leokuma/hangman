import * as Env from '../env.ts';
import {Mongo} from '../deps.ts';

export async function addChannel(channelId: bigint) {
	const channelIdLong = Mongo.Bson.Long.fromBigInt(channelId);
	const mongo = new Mongo.MongoClient();
	await mongo.connect(Env.Mongo.CONNECT_OPTIONS);

	const channels = mongo.database('hangman').collection('channels');

	if (await channels.findOne({id: channelIdLong}))
		return false;

	return await channels.insertOne({
		id: channelIdLong,
		status: 1
	});
}