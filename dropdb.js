const readline = require('readline');
const Players = require('./db.js');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

rl.question('Are you sure you want to drop the database? (y/n)', function(answer) {
	if (answer == 'y') {
		rl.close();
		Players.drop();
	}
	else {
		console.log('Aborting');
		rl.close();
	}
});