const { SlashCommandBuilder } = require('@discordjs/builders');
const { OverwatchAccounts } = require('../db.js');
const fetch = require('node-fetch');
const { EmbedBuilder } = require('@discordjs/builders');
const { PNG } = require ('pngjs');
const { getFullStats } = require ('../owapi');


function capitalizeFirstLetter(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function getStatsfromData(data) {
	const PLAYER_ICON = data.summary.avatar ?? 'None';
	const TITLE = data.summary.title ?? 'None';
	const BACKGROUND = data.summary.namecard ?? 'None';
	const PRIVACY = data.summary.privacy ?? 'None';
	const LATEST_SEASON = data.summary?.competitive?.pc?.season ?? 'No Ranked Data';
	const TANK_RANK = data.summary?.competitive?.pc?.tank?.division && data.summary?.competitive?.pc.tank?.tier ? [capitalizeFirstLetter(data.summary.competitive.pc.tank.division), data.summary.competitive.pc.tank.tier] : ['Unranked', ''];
	const DAMAGE_RANK = data.summary?.competitive?.pc?.damage?.division && data.summary.competitive?.pc.damage?.tier ? [capitalizeFirstLetter(data.summary.competitive.pc.damage.division), data.summary.competitive.pc.damage.tier] : ['Unranked', ''];
	const SUPPORT_RANK = data.summary?.competitive?.pc?.support?.division && data.summary.competitive?.pc.support.tier ? [capitalizeFirstLetter(data.summary.competitive.pc.support.division), data.summary.competitive.pc.support.tier] : ['Unranked', ''];

	// Top 3 Heroes
	let heroes = [];
	for (const entry of data.stats.pc.quickplay.heroes_comparisons.time_played.values) {
		heroes[entry.hero] ? heroes[entry.hero] += entry.value : heroes[entry.hero] = entry.value;
	}

	for (const entry of data.stats.pc.competitive.heroes_comparisons.time_played.values) {
		heroes[entry.hero] ? heroes[entry.hero] += entry.value : heroes[entry.hero] = entry.value;
	}

	// Get the top 3
	heroes = Object.entries(heroes).sort((a, b) => b[1] - a[1]).slice(0, 3);
	// Reformat into a string
	let top_heroes_string = '';
	heroes.forEach((hero) => {
		top_heroes_string += `${capitalizeFirstLetter(hero[0])}, `;
	});
	const TOP_HEROES = top_heroes_string.slice(0, -2);

	return { PLAYER_ICON, BACKGROUND, TITLE, LATEST_SEASON, TANK_RANK, DAMAGE_RANK, SUPPORT_RANK, PRIVACY, TOP_HEROES };
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

async function saveSummary(battletag, data) {
	try {
		const BATTLETAG = battletag;

		console.log(`Saving ${BATTLETAG} to database...`);
		// eslint-disable-next-line no-unused-vars
		const Account = await OverwatchAccounts.create({
			battletag: BATTLETAG,
			data: data,
		});
	}
	catch (error) { console.log(error); }
}
async function createSummaryEmbed(battletag, data, timestamp) {
	const { PLAYER_ICON, TITLE, LATEST_SEASON, TANK_RANK, DAMAGE_RANK, SUPPORT_RANK, PRIVACY, TOP_HEROES } = getStatsfromData(data);


	// Tier Icons
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
	const tank_icon = iconMap[TANK_RANK[0].toLowerCase()] || ':grey_question:';
	const damage_icon = iconMap[DAMAGE_RANK[0].toLowerCase()] || ':grey_question:';
	const support_icon = iconMap[SUPPORT_RANK[0].toLowerCase()] || ':grey_question:';

	// Color
	let color;
	try {
		const response = await fetch(PLAYER_ICON);
		if (!response.ok) {
			console.log('Error retrieving img');
		}
		const imageBuffer = await response.buffer();
		color = await findMostCommonColor(imageBuffer);
	}
	catch (error) {
		console.log(`Error ${error}`);
	}

	// Time of Embed
	const unix_timestamp = Math.round(timestamp / 1000);
	let embed;
	if (PRIVACY === 'public') {
		embed = new EmbedBuilder()
			.setTitle(`${data.summary.username}`)
			.setColor(color)
			.setDescription(`${TITLE}`)
			.setThumbnail(PLAYER_ICON)
			.addFields(
				{ name: 'Last placed: ', value: `Season: ${LATEST_SEASON}` },
				{ name: 'Tank <:Tank:1151658743298265212>', value: `${tank_icon} ${TANK_RANK[0]} ${TANK_RANK[1]}`, inline: true },
				{ name: 'Damage <:Support:1151658769378459719>', value: `${damage_icon} ${DAMAGE_RANK[0]} ${DAMAGE_RANK[1]}`, inline: true },
				{ name: 'Support <:Damage:1151658759018532984> ', value: `${support_icon} ${SUPPORT_RANK[0]} ${SUPPORT_RANK[1]}`, inline: true },
				{ name: 'Top 3 Heroes', value: TOP_HEROES, inline: true },
				// { name: 'Full Profile:', value: `[Link](https://playoverwatch.com/en-us/career/pc/${battletag})`, inline: true },
				{ name: 'Last updated:', value: `<t:${unix_timestamp}:R>`, inlue: true },
			);
	}
	else {
		embed = new EmbedBuilder()
			.setTitle(`${data.summary.username}`)
			.setColor(color)
			.setDescription(`${TITLE}`)
			.setThumbnail(PLAYER_ICON)
			.addFields(
				{ name: 'Profile Private', value: ':lock:' },
				{ name: 'Last updated:', value: `<t:${unix_timestamp}:R>`, inlue: true },
			);

	}

	return { embeds: [embed] };

}

async function needsLookup(battletag, interaction) {
	console.log('Looking up', battletag + '...');
	// if (player)
	// Make a html request to the overwatch api
	const { data, response } = await getFullStats(battletag);
	let now;
	switch (response.status) {
	case 200:
		console.log(`Success: ${response.status}`);
		now = new Date();
		interaction.editReply(await createSummaryEmbed(battletag, data, now));
		saveSummary(battletag, data);
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

module.exports = {
	cooldown: 10,
	data: new SlashCommandBuilder()
		.setName('lookup')
		.setDescription('Looks up Overwatch stats for a user')
		.addStringOption(option =>
			option.setName('battletag')
				.setDescription('The battletag of the user to look up. Case sensitive.')
				.setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		const battletag = interaction.options.getString('battletag').replace('#', '-');
		const latest_account = await OverwatchAccounts.findOne({ where: { battletag: battletag }, order: [['createdAt', 'DESC']] }) ?? null;

		if (latest_account) {
			// Get current time
			const now = new Date();
			// Get time of last update
			const last_update = new Date(latest_account.createdAt);
			// Check if last update was within one hour
			const diff = Math.abs(now - last_update);
			const minutes = Math.floor((diff / 1000) / 60);
			if (minutes < 30) {
				console.log('Found in database, sending embed...');
				interaction.editReply(await createSummaryEmbed(battletag, latest_account.data, last_update));
				return;
			}
			else {
				await needsLookup(battletag, interaction);
			}
		}
		else {
			await needsLookup(battletag, interaction);
		}

	},
};