import {serve} from './deps.js';
import {MongoClient} from './deps.js';
import {connect} from './deps.js';

const ws = new WebSocket('wss://gateway.discord.gg/v=8&encoding=json');

ws.addEventListener('error', function (event) {
	console.log(event.data);
});

ws.addEventListener('open', function (event) {
	console.log('conectou');
	ws.send(JSON.stringify({
		"op": 1,
		"d": null
	}));

	ws.send(JSON.stringify({
		"op": 2,
		"d": {
			"token": "Nzk2MzYyNDQ1MjQ0ODU4Mzc4.X_W0Ug.b0X_rbhldf4ta2Z7zSaJbUPJ5Po",
			"intents": 13824,
			"properties": {
				"$os": "linux",
				"$browser": "Deno",
				"$device": "Deno"
			}
		}
	}));
});

// Listen for messages
ws.addEventListener('message', function (event) {
	console.log('Message from server ', event.data);
});




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