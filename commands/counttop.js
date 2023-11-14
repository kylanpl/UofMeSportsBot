const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { Counter } = require('../db.js');
module.exports = {
	cooldown: 10,
	data: new SlashCommandBuilder()
		.setName('counttop')
		.setDescription('Returns a list of the top counters.'),
	async execute(interaction) {


		Counter.sync();
		const allCounters = await Counter.findAll({ order: [['count', 'DESC']], where: { guild: interaction.guild.id } });

		for (const counter of allCounters) {
			// Rank them
			counter.rank = allCounters.indexOf(counter) + 1;
		}
		let currentPageNum = 1;

		function getNewPage() {
			const currentPageContents = allCounters.slice((currentPageNum - 1) * 10, currentPageNum * 10);

			const topCounterStrings = currentPageContents.map(counter => `${counter.rank}. ${counter.countee}: ${counter.count}`);
			return `# Top Counts\n${topCounterStrings.join('\n')} \n Page ${currentPageNum} of ${Math.ceil(allCounters.length / 10)}`;

		}

		// Buttons
		const backardButton = new ButtonBuilder().setCustomId('back').setLabel('<').setStyle(ButtonStyle.Secondary);
		const forwardButton = new ButtonBuilder().setCustomId('forward').setLabel('>').setStyle(ButtonStyle.Secondary);
		const row = new ActionRowBuilder().addComponents(backardButton, forwardButton);

		await interaction.reply({
			content: getNewPage(),
			components: [row],
		});


		const filter = i => i.user.id === interaction.user.id;
		const collector = interaction.channel.createMessageComponentCollector({ filter, time: 300000 });

		collector.on('collect', m => {
			if (m.customId === 'back') {
				if (currentPageNum > 1) {
					currentPageNum--;
				}
				m.update({ content:  getNewPage() });
			}
			else if (m.customId === 'forward') {
				if (currentPageNum < Math.ceil(allCounters.length / 10)) {
					currentPageNum++;
				}
				m.update({ content: getNewPage() });
			}
		});


	},
};