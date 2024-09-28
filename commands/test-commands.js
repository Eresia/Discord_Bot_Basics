import { SlashCommandBuilder } from 'discord.js';
import * as DiscordUtils from '../scripts/discord-utils.js';

export let allCommands = [];

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

allCommands.push({
	data: new SlashCommandBuilder()
		.setName('ping-someone')
		.setDescription('Ping someone on a channel')
		.addChannelOption(option =>
			option
				.setName('channel')
				.setDescription('Channel to ping')
				.setRequired(true))
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('User')
				.setRequired(false)),

	async execute(interaction, dataManager) {
		dataManager.initGuildData(interaction.guild.id);

		let user = interaction.options.getUser('user');
		let channel = interaction.options.getChannel('channel');

		channel.send('Hello ' + DiscordUtils.getUserStringById(user.id) + ', tu as été ping sur ce chan !');
		interaction.reply({content: 'Success', ephemeral: true});
	}
});

allCommands.push({
	data: new SlashCommandBuilder()
		.setName('set-role')
		.setDescription('Set role')
		.addStringOption(option =>
			option
				.setName('message')
				.setDescription('Message to display')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('emoji')
				.setDescription('Emoji')
				.setRequired(true))
		.addRoleOption(option =>
			option
				.setName('role')
				.setDescription('Role')
				.setRequired(true)),

	async execute(interaction, dataManager) {
		dataManager.initGuildData(interaction.guild.id);

		let message = interaction.options.getString('message');
		let emoji = interaction.options.getString('emoji');
		let role = interaction.options.getRole('role');

		let answer = await interaction.channel.send(message);
		await answer.react(emoji);

		const filter = function(reaction) 
		{
			return reaction.emoji.name === emoji;
		};
		const collector = answer.createReactionCollector({filter: filter, max: 0});

		collector.on('collect', async function(reaction, user)
		{
			let member = await DiscordUtils.getMemberById(interaction.guild, user.id);
			member.roles.add(role);
		});

		interaction.reply({content: 'Success', ephemeral: true})
	}
});