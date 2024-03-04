const once = false;
const name = 'interactionCreate';


async function invoke(interaction) {
	try {
		if (interaction.isChatInputCommand()) {(await import(`#commands/${interaction.commandName}`)).invoke(interaction);}
	}
	catch (error) {
		console.log(error);
		interaction.reply('Error');
	}

}


export { once, name, invoke };
