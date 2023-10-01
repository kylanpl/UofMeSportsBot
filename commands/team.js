const { SlashCommandBuilder } = require('@discordjs/builders');
// const Players = require('../db.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {

		await interaction.reply('Pong!');
	},
};

