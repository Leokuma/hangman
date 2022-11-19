import * as Env from '../env.ts';
import {Redis} from '../deps.ts';

export async function getRandomWords(n = 1): Promise<string[]> {
	const redis = await Redis.connect(Env.Redis.CONNECT_OPTIONS);
	const words = await redis.srandmember('words', n);
	redis.close();

	return words;
}