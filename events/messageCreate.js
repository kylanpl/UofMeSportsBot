const once = false;
const name = 'messageCreate';
import { Counter } from '../db.js';


async function tryBic(message) {
	if (!message.author.bot) {
	// Check last two characters of message
		const lastTwo = message.content.slice(-2);
		const hasMentions = message.mentions.everyone || message.mentions.users.size > 0 || message.mentions.roles.size > 0;
		// const rest of string
		if ((lastTwo === '++' || lastTwo === '--') && !hasMentions) {
			const increase = lastTwo === '++';
			const string = message.content.slice(0, -2);
			const string_exists = await Counter.findOne({ where: { countee: string, guild: message.guild.id } }) ?? null;
			let temp_counter = string_exists?.count ?? 1;
			if (string_exists) {
				if (lastTwo == '++') {
					// Increment count
					string_exists.increment('count');
					temp_counter++;
				}
				else if (lastTwo == '--') {
					// Code to remove from database
					string_exists.decrement('count');
					temp_counter--;
				}

			}
			else if (increase) {
				// eslint-disable-next-line no-unused-vars
				const CounterString = await Counter.create({
					countee: string,
					count: 1,
					guild: message.guild.id,
				});
				temp_counter = 1;
				console.log(`Created counter for ${string}`);
			}
			else if (!increase) {
				// eslint-disable-next-line no-unused-vars
				const CounterString = await Counter.create({
					countee: string,
					count: -1,
					guild: message.guild.id,
				});
				temp_counter = -1;
			}
			// Send message to channel
			// Make sure message does not contain a ping
			message.reply(`${string} == ${temp_counter}`);
			return true;
		}
	}
	return false;
}

async function invoke(message) {
	tryBic(message);


}


export { once, name, invoke };

