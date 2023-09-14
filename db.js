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
	tag : {
		type: Sequelize.STRING,
		primaryKey: true,
		unique: true,
	},
	icon : Sequelize.STRING,
	background : Sequelize.STRING,
	tank_rank : Sequelize.STRING,
	damage_rank : Sequelize.STRING,
	support_rank : Sequelize.STRING,
});

module.exports = { Players, OverwatchAccounts };