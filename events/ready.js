import fs from 'fs';
import { OverwatchAccounts, Counter } from '../db.js';

const once = true;
const name = 'ready';

function syncDatabase() {
	OverwatchAccounts.sync();
	Counter.sync();
}

async function invoke(client) {
	const commands = fs
		.readdirSync('./events/commands')
		.filter((file) => file.endsWith('.js'))
		.map((file) => file.slice(0, -3));
	const commandsArray = [];

	// Load Commands
	for (const command of commands) {
		const commandFile = await import(`#commands/${command}`);
		commandsArray.push(commandFile.create());
	}

	client.application.commands.set(commandsArray);
	console.log(`Succesfully logged in as ${client.user.tag}`);

	// Database
	syncDatabase();
}


export { once, name, invoke };

