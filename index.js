// Require the necessary discord.js classes
import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'node:fs';
import {} from 'dotenv/config';


// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });


const events = fs
	.readdirSync('./events')
	.filter((file) => file.endsWith('.js'));

for (const event of events) {
	const eventFile = await import (`#events/${event}`);

	if (eventFile.once) {
		client.once(eventFile.name, (...args) => {
			eventFile.invoke(...args);
		});
	}

	else {
		client.on(eventFile.name, (...args) => {
			eventFile.invoke(...args);
		});
	}
}
// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'


// Log in to Discord with your client's token
client.login(process.env.TOKEN);
