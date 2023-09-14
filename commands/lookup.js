const { SlashCommandBuilder } = require('@discordjs/builders');
const { OverwatchAccounts } = require('../db.js');
const fetch = require('node-fetch');
const { EmbedBuilder } = require('@discordjs/builders');
const { PNG } = require ('pngjs');
const { getSummary } = require ('../owapi');

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

async function sendEmbed(battletag, data) {
	const tank_rank = data.competitive?.pc?.tank?.division
		? capitalizeFirstLetter(data.competitive.pc.tank.division) + ' ' + data.competitive.pc.tank.tier
		: 'Unranked';

	const damage_rank = data.competitive?.pc?.damage?.division
		? capitalizeFirstLetter(data.competitive.pc.damage.division) + ' ' + data.competitive.pc.damage.tier
		: 'Unranked';

	const support_rank = data.competitive?.pc?.support?.division
		? capitalizeFirstLetter(data.competitive.pc.support.division) + ' ' + data.competitive.pc.support.tier
		: 'Unranked';


	const iconMap = {
		null: ':grey_question:',
		'bronze': '<:Bronze:1151658779646099566>',
		'silver': '<:Silver:1151658789720825926>',
		'gold': '<:Gold:1151658799787159643>',
		'platinum': '<:Platinum:1151658810763653221>',
		'diamond': '<:Diamond:1151658820523786270>',
		'master': '<:Master:1151658831072465046>',
		'grandmaster': '<:Grandmaster:1151658843370176633>',
	};

	const tank_icon = iconMap[data.competitive?.pc?.tank?.division] || ':grey_question:';
	const damage_icon = iconMap[data.competitive?.pc?.damage?.division] || ':grey_question:';
	const support_icon = iconMap[data.competitive?.pc?.support?.division] || ':grey_question:';
	const title = data.title ?? ' ';

	const avatar = data.avatar;
	let color;
	try {
		const response = await fetch(avatar);
		if (!response.ok) {
			console.log('Error retrieving img');
		}
		const imageBuffer = await response.buffer();
		color = await findMostCommonColor(imageBuffer);
	}
	catch (error) {
		console.log(`Error ${error}`);
	}

	const embed = new EmbedBuilder()
		.setTitle(`${data.username}`)
		.setColor(color)
		.setDescription(`${title}`)
		.setThumbnail(avatar)
		.addFields(
			{ name: 'Last placed: ', value: data.competitive?.pc?.season ? `Season ${data.competitive.pc.season}` : 'No Ranked Data' },
			{ name: 'Tank <:Tank:1151658743298265212>', value: `${tank_icon} ${tank_rank}`, inline: true },
			{ name: 'Damage <:Support:1151658769378459719>', value: `${damage_icon} ${damage_rank}`, inline: true },
			{ name: 'Support <:Damage:1151658759018532984> ', value: `${support_icon} ${support_rank}`, inline: true },
			{ name: 'Full Profile:', value: `[Link](https://playoverwatch.com/en-us/career/pc/${battletag})` },
		);


	return { embeds: [embed] };

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
		const player = await OverwatchAccounts.findOne({ where: { tag: battletag } });
		console.log('Looking up', battletag + '...');
		if (player) {
			// TODO: Add to database
		}
		if (!player) {
			// Make a html request to the overwatch api
			const { data, response } = await getSummary(battletag);
			switch (response.status) {
			case 200:
				console.log(`Success: ${response.status}`);
				interaction.editReply(await sendEmbed(battletag, data));
				console.log('Embed sent.');
				break;
			case 404:
				console.log(`Failure: ${response.status}`);
				interaction.editReply('Invalid battletag.');
				break;
			case 504:
				console.log(`Failure: ${response.status}`);
				interaction.editReply('Blizzard server error. Try again.');
				break;
			default:
				console.log(`Failure: ${response.status}`);
				interaction.editReply('I have no idea what\'s going on lmao');
				break;
			}
		}

	},
};

