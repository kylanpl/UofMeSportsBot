const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
require('dotenv').config();

client.once('ready', () => {
	console.log('Bot is online');
});

client.on('messageCreate', message => {
	if (message.content === '!ping') {
		message.channel.send('Pong!');
	}
});

client.login(process.env.TOKEN);
