import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';

let roleIds;
let teamAcronym;
let teamName;
let reason;
const channelIds = [];

async function createChannels(interaction) {
	// Create Channels
	const staffTextPermissions = [
		{
			id: interaction.guild.roles.everyone.id,
			deny: [PermissionFlagsBits.SendMessages | PermissionFlagsBits.ViewChannel],
		},
		{
			id: roleIds[0],
			allow: [PermissionFlagsBits.ViewChannel],
		},
		{
			id: roleIds[1],
			allow: [PermissionFlagsBits.SendMessages | PermissionFlagsBits.ViewChannel],
		},
		{
			id: roleIds[2],
			allow: [PermissionFlagsBits.SendMessages | PermissionFlagsBits.ViewChannel],
		},
	];

	const teamTextPermissions = [
		{
			id: interaction.guild.roles.everyone.id,
			deny: [PermissionFlagsBits.SendMessages | PermissionFlagsBits.ViewChannel],
		},
		{
			id: roleIds[0],
			allow: [PermissionFlagsBits.SendMessages | PermissionFlagsBits.ViewChannel],
		},
		{
			id: roleIds[1],
			allow: [PermissionFlagsBits.SendMessages | PermissionFlagsBits.ViewChannel],
		},
		{
			id: roleIds[2],
			allow: [PermissionFlagsBits.SendMessages | PermissionFlagsBits.ViewChannel],
		},
	];

	const staffVoicePermissions = [
		{
			id: interaction.guild.roles.everyone.id,
			deny: [PermissionFlagsBits.ViewChannel | PermissionFlagsBits.Connect],
		},
		{
			id: roleIds[0],
			allow: [PermissionFlagsBits.ViewChannel],
		},
		{
			id: roleIds[1],
			allow: [PermissionFlagsBits.ViewChannel | PermissionFlagsBits.Connect | PermissionFlagsBits.MoveMembers],
		},
		{
			id: roleIds[2],
			allow: [PermissionFlagsBits.ViewChannel | PermissionFlagsBits.Connect | PermissionFlagsBits.MoveMembers],
		},
	];

	const teamVoicePermissions = [
		{
			id: interaction.guild.roles.everyone.id,
			deny: [PermissionFlagsBits.ViewChannel | PermissionFlagsBits.Connect],
		},
		{
			id: roleIds[0],
			allow: [PermissionFlagsBits.ViewChannel | PermissionFlagsBits.Connect],
		},
		{
			id: roleIds[1],
			allow: [PermissionFlagsBits.ViewChannel | PermissionFlagsBits.Connect | PermissionFlagsBits.MoveMembers],
		},
		{
			id: roleIds[2],
			allow: [PermissionFlagsBits.ViewChannel | PermissionFlagsBits.Connect | PermissionFlagsBits.MoveMembers],
		},
	];

	const subchannels = [];
	const category = await interaction.guild.channels.create({
		name: `${teamName}`,
		type: ChannelType.GuildCategory,
		reason: reason,
	});
	const promises = [
		category.children.create({
			name: `${teamAcronym}-announcements`,
			type: ChannelType.GuildText,
			reason: reason,
			permissionOverwrites: staffTextPermissions,
			topic: 'Official Updates & News',
		}),
		category.children.create({
			name: `${teamAcronym}-scheduling`,
			type: ChannelType.GuildText,
			reason: reason,
			permissionOverwrites: staffTextPermissions,
			topic: 'Practice & Event Coordination',
		}),
		category.children.create({
			name: `${teamAcronym}-attendance`,
			type: ChannelType.GuildText,
			reason: reason,
			permissionOverwrites: teamTextPermissions,
			topic: 'Absence Notifications & Reasons',
		}),
		category.children.create({
			name: `${teamAcronym}-team-chat`,
			type: ChannelType.GuildText,
			reason: reason,
			permissionOverwrites: teamTextPermissions,
			topic: 'General Team Discussions',
		}),
		category.children.create({
			name: `${teamAcronym}-notes`,
			type: ChannelType.GuildText,
			reason: reason,
			permissionOverwrites: teamTextPermissions,
			topic: 'VOD Analysis & Targeted Improvement Tips',
		}),
		category.children.create({
			name: `${teamAcronym} Team Voice`,
			type: ChannelType.GuildVoice,
			reason: reason,
			permissionOverwrites: teamVoicePermissions,
		}),
		category.children.create({
			name: `${teamAcronym} Coaching`,
			type: ChannelType.GuildVoice,
			reason: reason,
			permissionOverwrites: staffVoicePermissions,
		}),
	];

	const results = await Promise.all(promises);
	results.forEach((channel) => {
		subchannels.push(channel);
	});

	subchannels.forEach((channel) => {
		channelIds.push(channel.id);
	});
}
const create = () => {
	const command = new SlashCommandBuilder()
		.setName('createteam')
		.setDescription('Creates all the roles and channels for a team.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels | PermissionFlagsBits.ManageRoles)
		.setDMPermission(false)
		.addStringOption((option) =>
			option
				.setName('team-name')
				.setDescription('The name for the team. "Varsity Valorant" for example')
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('color')
				.setDescription('The color to be used for the roles in #00FF00 (hex) format.')
				.setRequired(true),
		)
		.addUserOption((option) =>
			option
				.setName('manager')
				.setDescription('The (optional) user to be given the manager role. They will receive a message informing them.')
				.setRequired(false),
		);


	return command.toJSON();
};

const invoke = async (interaction) => {
	interaction.deferReply();
	teamName = interaction.options.getString('team-name');
	teamAcronym = teamName.split(' ').map((word) => word[0]).join('').toUpperCase();
	reason = `Create team command for ${teamName} run by ${interaction.user.tag}`;

	// Create Roles
	const color = interaction.options.getString('color');
	const roleNames = ['', ' Manager', ' Coach'];
	roleIds = [];
	for (const roleName of roleNames) {
		await interaction.guild.roles
			.create({ name: `${teamName} ${roleName}`, reason: reason, color: color })
			.then((role) => {
				roleIds.push(role.id);
			})
			.catch(console.error);
	}

	await createChannels(interaction, roleIds);

	// Add and notify manager
	const serverLink = `https://discord.com/channels/${interaction.guild.id}/`;
	if (interaction.options.getUser('manager')) {
		const manager = interaction.options.getUser('manager');
		await interaction.guild.members
			.fetch(manager.id)
			.then((member) => {
				member.roles.add(roleIds[1]);
				const embed = new EmbedBuilder()
					.setTitle(`Congratulations on Becoming the Manager of ${teamName}!`)
					.setDescription(
						'Welcome to your new role! I am a bot, so if you at any time have any questions, DM <@116289585570512898>. We\'re going to run through everything real quick.',
					)
					.setColor(color)
					.setThumbnail(
						'https://cdn.discordapp.com/icons/892475884781600838/c281f8ad395623ca63f788e6aa24ac41.webp?size=160',
					)
					.addFields(
						{
							name: 'Team Channels',
							value: `${serverLink}${channelIds[0]}\nFor posting your team's official updates & news. Only coaches and managers can send messages here.\n\n${serverLink}${channelIds[1]}\nThe place for (optionally) using our scheduling bot to coordinate times for your practices and events. Only coaches and managers can send messages here.\n\n${serverLink}${channelIds[2]}\nThe place for you and your players to let each other know why and when you'll miss a practice or event.\n\n${serverLink}${channelIds[3]}\nGeneral team discussions.\n\n${serverLink}${channelIds[4]}\nA place for you to post coaching notes and tips.\n\nIf you'd like to run things a different way, that's okay! We just provide these channels as a guideline. Let us know if you need changes. `,
						},
						{
							name: 'Team Voice Channels',
							value: `You also have two voice channels.\nOne for general team use, and one for coaching. Only managers and coaches can move people into the coaching channel.\n${serverLink}${channelIds[5]}\n${serverLink}${channelIds[6]}`,
						},
						{
							name: 'Staff Channel',
							value: `You should now have access to a channel called ${serverLink}1152475902295429130. All coaches and managers are in this channel along with some of the other organization staff. Feel free to chat here with your fellow staff members.`,
						},
						{
							name: 'What now?',
							value: 'That\'s really up to you and your team. You can schedule some practices, join tournaments, or just play some ranked with your team. As manager, you make the decisions for the team and we\'re just here to help you with anything you need or don\'t understand. Don\'t hesitate to reach out, and good luck!',
						},
					);
				member.send({ embeds: [embed] });
			})
			.catch(console.error);
	}
	interaction.editReply('Team created!');
};

export { create, invoke };