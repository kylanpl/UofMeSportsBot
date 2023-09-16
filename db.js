const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'database.sqlite',
});

const Players = sequelize.define('players', {
	id : {
		type: Sequelize.INTEGER,
		primaryKey: true,
		unique: true,
	},
});

const OverwatchAccounts = sequelize.define('overwatch_accounts', {
	id : {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoincrement: true,
	},
	battletag : Sequelize.STRING,
	data: Sequelize.JSON,
});

module.exports = { Players, OverwatchAccounts };