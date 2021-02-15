import {serve} from './deps.js';
import {connect} from './deps.js';
import {Hangman} from './deps.js';

(new Hangman()).connect();

// const server = serve({port: +Deno.env.get('PORT')});

// console.log('Listening on port', Deno.env.get('PORT'));

// const client = new MongoClient();
// await client.connect(Deno.env.get('MONGO_URL'));

// const redis = await connect({
// 	hostname: Deno.env.get('REDIS_HOSTNAME'),
// 	port: Deno.env.get('REDIS_PORT')
// });

// for await (const req of server) {
// 	const path = new URL(req.url, Deno.env.get('BASE_URL')).searchParams;
// 	req.respond({body: 'Hello Word'});
// }