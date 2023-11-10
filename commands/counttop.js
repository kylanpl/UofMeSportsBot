const { SlashCommandBuilder } = require('@discordjs/builders');
const { Counter } = require('../db.js');
module.exports = {
	cooldown: 10,
	data: new SlashCommandBuilder()
		.setName('counttop')
		.setDescription('Returns a list of the top counters.'),
	async execute(interaction) {
		Counter.sync();
		const topCounters = await Counter.findAll({ order: [['count', 'DESC']], limit: 10 });
		const topCounterStrings = topCounters.map(counter => `${counter.countee}: ${counter.count}`);
		await interaction.reply(topCounterStrings.join('\n'));
	},
};