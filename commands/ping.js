const { SlashCommandBuilder } = require('@discordjs/builders');
module.exports = {
	cooldown: 10,
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with pong, most of the time.'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};