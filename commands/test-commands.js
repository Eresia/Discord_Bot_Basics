const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordUtils = require('../scripts/discord-utils.js');

let allCommands = [];

allCommands.push({
	data: new SlashCommandBuilder()
		.setName('hello')
		.setDescription('Say hello at someone')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('User to say hello')
				.setRequired(true)),

	async execute(interaction, dataManager) {
		dataManager.initGuildData(interaction.guild.id);

		let user = interaction.options.getUser('user');
		interaction.reply('Hello ' + DiscordUtils.getUserStringById(user.id) + '!');
	}
});

module.exports = {
	allCommands
};