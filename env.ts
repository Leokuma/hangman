import {
	Mongo as MongoClient,
	Redis as RedisClient
} from './deps.ts'

console.log('LOADING ENV');

const APP_ID = <bigint><unknown>Deno.env.get('HANGMAN_APP_ID');
const TOKEN = <string>Deno.env.get('HANGMAN_TOKEN');
const COLLINS_URL = <string>Deno.env.get('COLLINS_API_URL');
const COLLINS_KEY = <string>Deno.env.get('COLLINS_API_KEY');

let GUILD_ID: bigint | null = null;
if (Deno.env.get('GUILD_ID')) {
	try {
		GUILD_ID = BigInt(<string>Deno.env.get('GUILD_ID'));
	} catch {
		GUILD_ID = null;
	}
}

const mongoHosts = Deno.env.get('HANGMAN_MONGO_HOSTS');
const mongoPort = +<number><unknown>Deno.env.get('HANGMAN_MONGO_PORT');

if (!(mongoHosts && mongoPort))
	throw new Error('Could not retrieve Mongo port or hosts. Check your environment variables.');

const Mongo = {
	CONNECT_OPTIONS: <MongoClient.ConnectOptions>{
		credential: {
			db: 'admin',
			mechanism: <string>Deno.env.get('HANGMAN_MONGO_MECHANISM'),
			password: <string>Deno.env.get('HANGMAN_MONGO_PASS'),
			username: <string>Deno.env.get('HANGMAN_MONGO_USER'),
		},
		db: <string>Deno.env.get('HANGMAN_MONGO_DB'),
		retryWrites: true,
		servers: mongoHosts
			.split(',')
			.map(host => ({host, port: mongoPort})),
		tls: (<string>Deno.env.get('HANGMAN_MONGO_TLS') == 'true')
	}
}

const Redis = {
	CONNECT_OPTIONS: <RedisClient.RedisConnectOptions>{
		hostname: <string>Deno.env.get('HANGMAN_REDIS_HOST'),
		password: <string>Deno.env.get('HANGMAN_REDIS_PASS'),
		port: <number><unknown>Deno.env.get('HANGMAN_REDIS_PORT')
	}
}

if (!(APP_ID && TOKEN && COLLINS_KEY && COLLINS_URL && Mongo.CONNECT_OPTIONS.db && Mongo.CONNECT_OPTIONS.servers?.length && Mongo.CONNECT_OPTIONS.credential?.password && Mongo.CONNECT_OPTIONS.credential?.username && Mongo.CONNECT_OPTIONS.credential?.mechanism && Mongo.CONNECT_OPTIONS.credential?.db && Redis.CONNECT_OPTIONS.hostname && Redis.CONNECT_OPTIONS.password && Redis.CONNECT_OPTIONS.port))
	throw new Error('Could not retrieve environment variables.');


export {APP_ID, COLLINS_KEY, COLLINS_URL, GUILD_ID, Mongo, Redis, TOKEN};