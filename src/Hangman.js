export class Hangman {
	constructor() {
		this.HANGMAN_TOKEN = Deno.env.get('HANGMAN_TOKEN');
		this.DISCORD_ENDPOINT = Deno.env.get('DISCORD_ENDPOINT');
		this.INTENTS = 13824;
	}

	async connect() {
		/** @todo Maybe caching and fetching the URL from Redis is faster */
		const response = await fetch(this.DISCORD_ENDPOINT + 'gateway/bot', {
			headers: {
				Authorization: 'Bot ' + this.HANGMAN_TOKEN
			}
		});

		this.url = (await response.json()).url;

		this.gateway = new WebSocket(this.url);

		this.gateway.onmessage = ev => {
			console.log('[Hangman] Received', ev.data);

			const payload = JSON.parse(ev.data);

			switch (payload.op) {
				case 0: this.onDispatch(payload); break;
				case 1: this.onHeartbeat(payload); break;
				case 7: this.onReconnect(payload); break;
				case 9: this.onInvalidSession(payload); break;
				case 10: this.onHello(payload); break;
				case 11: this.onHeartbeatACK(payload); break;
				default: console.log('[Hangman] Unknown event received:', payload); break;
			}
		};

		this.gateway.onopen = ev => {
			console.log('[Hangman] Connected', ev);
			this.identify();
		};

		this.gateway.onclose = ev => {
			console.log('[Hangman] Closed', ev)
			clearInterval(this.heartbeat);
		};

		this.gateway.onerror = ev => {console.log('[Hangman] Error', ev)};
	}

	identify() {
		this.gateway.send(JSON.stringify({
			op: 2,
			d: {
				token: this.HANGMAN_TOKEN,
				intents: this.INTENTS,
				properties: {$os: 'linux', $browser: 'Deno', $device: 'Deno'}
			}
		}));
	}

	onDispatch(payload) {
		console.log('onDispatch', payload);
		this.seq = payload.s;
	}

	onHeartbeat(payload) {
		console.log('onHeartbeat', payload);
	}

	onHeartbeatACK(payload) {
		console.log('onHeartbeatACK', payload);
	}

	onReconnect(payload) {
		console.log('onReconnect', payload);
	}

	onInvalidSession(payload) {
		console.log('onInvalidSession', payload);
	}

	onHello(payload) {
		console.log('onHello', payload);
		this.heartbeat = setInterval(this.heartbeat.bind(this), payload.d.heartbeat_interval);
	}

	heartbeat() {
		this.gateway.send(JSON.stringify({
			op: 1,
			d: this.seq
		}));
	}
}