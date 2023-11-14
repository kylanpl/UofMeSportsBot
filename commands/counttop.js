const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
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
		const backButton = new ButtonBuilder().setCustomId('back').setLabel('<').setStyle(ButtonStyle.Secondary);
		const forwButton = new ButtonBuilder().setCustomId('forward').setLabel('>').setStyle(ButtonStyle.Secondary);
		const row = new ActionRowBuilder().addComponents(backButton, forwButton);

		await interaction.reply({
			content: `# Top Counters\n${topCounterStrings.join('\n')}`,
			components: [row],
		});
	},
};