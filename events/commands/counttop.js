import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js';
import { Counter } from '../../db.js';


const create = () => {
	const command = new SlashCommandBuilder()
		.setName('counttop')
		.setDescription('Returns a list of the top counters.');

	return command.toJSON();
};

const invoke = async (interaction) => {

	await Counter.sync();
	const allCounters = await Counter.findAll({ order: [['count', 'DESC']], where: { guild: interaction.guild.id } });

	allCounters.forEach((counter, index) => {
		counter.rank = index + 1;
	});

	let currentPageNum = 1;

	function getNewPage() {
		const currentPageContents = allCounters.slice((currentPageNum - 1) * 10, currentPageNum * 10);

		const topCounterStrings = currentPageContents.map(counter => `${counter.rank}. ${counter.countee}: ${counter.count}`);
		return `# Top Counts\n${topCounterStrings.join('\n')} \n Page ${currentPageNum} of ${Math.ceil(allCounters.length / 10)}`;
	}

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
			m.update({ content: getNewPage() });
		}
		else if (m.customId === 'forward') {
			if (currentPageNum < Math.ceil(allCounters.length / 10)) {
				currentPageNum++;
			}
			m.update({ content: getNewPage() });
		}
	});

};

export { create, invoke };

