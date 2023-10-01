// Require the necessary discord.js classes
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { OverwatchAccounts, Counter } = require('./db.js');
require('dotenv').config();

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });


// Commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	}
	else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	OverwatchAccounts.sync();
	Counter.sync();
	console.log(`Ready! Logged in as ${c.user.tag}`);

});

client.on(Events.MessageCreate, async message => {
	if (message.author.bot) return;
	// Check last two characters of message
	const lastTwo = message.content.slice(-2);
	const increase = lastTwo === '++';
	// const rest of string
	const string = message.content.slice(0, -2);

	if (lastTwo === '++' || lastTwo === '--') {
		const string_exists = await Counter.findOne({ where: { countee: string } }) ?? null;
		let temp_counter = string_exists?.count ?? 1;
		if (string_exists) {
			if (lastTwo == '++') {
				// Increment count
				string_exists.increment('count');
				temp_counter++;
			}
			else if (lastTwo == '--') {
				// Code to remove from database
				string_exists.decrement('count');
				temp_counter--;
			}

		}
		else if (increase) {
			// eslint-disable-next-line no-unused-vars
			const CounterString = await Counter.create({
				countee: string,
				count: 1,
			});
			temp_counter = 1;
			console.log(`Created counter for ${string}`);
		}
		else if (!increase) {
			// eslint-disable-next-line no-unused-vars
			const CounterString = await Counter.create({
				countee: string,
				count: -1,
			});
			temp_counter = -1;
		}
		// Send message to channel
		message.reply(`${string} == ${temp_counter}`);
	}


	else {
		return;
	}
});

// On interaction create
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	}
	catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		}
		else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// Log in to Discord with your client's token
client.login(process.env.TOKEN);