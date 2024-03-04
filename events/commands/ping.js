import { SlashCommandBuilder } from '@discordjs/builders';

const create = () => {
	const command = new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with pong, most of the time.');

	return command.toJSON();
};

const invoke = (interaction) => {
	interaction.reply('Pong!');
};

export { create, invoke };