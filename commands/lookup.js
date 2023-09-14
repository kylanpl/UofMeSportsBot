const { SlashCommandBuilder } = require('@discordjs/builders');
const { OverwatchAccounts } = require('../db.js');
const fetch = require('node-fetch');
const { EmbedBuilder } = require('@discordjs/builders');
const { PNG } = require ('pngjs');

function capitalizeFirstLetter(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

const findMostCommonColor = async (buffer) => {
	const colorMap = {};
	const png = PNG.sync.read(buffer);
	for (let i = 0; i < png.data.length; i += 4) {
		const color = `${png.data[i]},${png.data[i + 1]},${png.data[i + 2]}`;
		colorMap[color] = (colorMap[color] || 0) + 1;
	}
	const mostCommon = Object.entries(colorMap).sort((a, b) => b[1] - a[1])[0][0];
	return mostCommon.split(',').map(Number);
};

function intToHex(c) {
	const hex = c.toString(16);
	return hex.length == 1 ? '0' + hex : hex;
}

module.exports = {
	cooldown: 10,
	data: new SlashCommandBuilder()
		.setName('lookup')
		.setDescription('Looks up Overwatch stats for a user')
		.addStringOption(option =>
			option.setName('battletag')
				.setDescription('The battletag of the user to look up')
				.setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		const battletag = interaction.options.getString('battletag').replace('#', '-');
		let statsData;
		const player = await OverwatchAccounts.findOne({ where: { tag: battletag } });
		console.log('Looking up', battletag + '...');
		if (player) {
			// empty
		}
		if (!player) {
			// Make a html request to the overwatch api

			try {
				const response = await fetch(`https://overfast-api.tekrop.fr/players/${battletag}/summary`);
				statsData = await response.json();

			}
			catch (error) {
				console.log('Error:', error);
			}
		}

		console.log(statsData);
		const tank_rank = statsData.competitive?.pc?.tank?.division
			? capitalizeFirstLetter(statsData.competitive.pc.tank.division) + ' ' + statsData.competitive.pc.tank.tier
			: 'Unranked';

		const damage_rank = statsData.competitive?.pc?.damage?.division
			? capitalizeFirstLetter(statsData.competitive.pc.damage.division) + ' ' + statsData.competitive.pc.damage.tier
			: 'Unranked';

		const support_rank = statsData.competitive?.pc?.support?.division
			? capitalizeFirstLetter(statsData.competitive.pc.support.division) + ' ' + statsData.competitive.pc.support.tier
			: 'Unranked';

        const title = statsData.title ?? ' ';

		const avatar = statsData.avatar;
		let color;
		try {
			const response = await fetch(avatar);
			console.log(avatar);
			console.log(response.headers.get('Content-Type'));
			if (!response.ok) {
				console.log('Error retrieving img');
			}
			const imageBuffer = await response.buffer();
			color = await findMostCommonColor(imageBuffer);
			console.log(`${color[0]},${color[1]},${color[2]}`);
			console.log(intToHex(color[0]) + intToHex(color[1]) + intToHex(color[2]));
		}
		catch (error) {
			console.log(`Error ${error}`);
		}

		const embed = new EmbedBuilder()
			.setTitle(`${statsData.username}`)
			.setColor(color)
			.setDescription(`${title}`)
			.setThumbnail(avatar)
			.addFields(
				{ name: 'Last placed: ', value: `Season ${statsData.competitive.pc.season}` },
				{ name: 'Tank <:Tank:1151658743298265212>', value: `${tank_rank}`, inline: true },
				{ name: 'Damage <:Support:1151658769378459719>', value: `${damage_rank}`, inline: true },
				{ name: 'Support <:Damage:1151658759018532984> ', value: `${support_rank}`, inline: true },
				{ name: 'Full Profile:', value: `[Link](https://playoverwatch.com/en-us/career/pc/${battletag})` },
			);


		await interaction.editReply({ embeds: [embed] });


	},
};

