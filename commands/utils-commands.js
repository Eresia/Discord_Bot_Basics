const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

let allCommands = [];

const emptyMessage = "\u200B";
const nbMaxEmbedField = 7;

function buildEmbedCommand()
{
	let command = new SlashCommandBuilder();
	command.setName('embed');
	command.setDescription('Add embed message');
	command.addStringOption(option => 
		option
			.setName('message-id')
			.setDescription('If you want modify a message in the channel')
			.setRequired(false)
	);
	command.addStringOption(option => 
		option
			.setName('title')
			.setDescription('Title of the embed')
			.setRequired(false)
	);
	command.addStringOption(option => 
		option
			.setName('description')
			.setDescription('Description of the embed')
			.setRequired(false)
	);

	for(let i = 1; i <= nbMaxEmbedField; i++)
	{
		command.addStringOption(option => 
			option
				.setName('field' + i + '-title')
				.setDescription('Title of the field ' + i)
				.setRequired(false)
		);

		command.addStringOption(option => 
			option
				.setName('field' + i + '-description')
				.setDescription('Description of the field ' + i)
				.setRequired(false)
		);

		command.addBooleanOption(option => 
			option
				.setName('field' + i + '-inline')
				.setDescription('Is field ' + i + ' inline ?')
				.setRequired(false)
		);
	}

	return command;
}

allCommands.push({
	data: buildEmbedCommand(),

	async execute(interaction, dataManager) {

		let messageId = interaction.options.getString('message-id');
		let message = null;

		if(messageId != null)
		{
			message = await interaction.channel.messages.fetch(messageId);
			if(message == null)
			{
				interaction.reply({content: 'Can\'t find message id ' + messageId, ephemeral: true});
				return;
			}

			if(message.author.id != interaction.client.user.id)
			{
				interaction.reply({content: 'Message has to be one of mine', ephemeral: true});
				return;
			}
		}

		let embed = new EmbedBuilder();

		let title = interaction.options.getString('title');
		let description = interaction.options.getString('description');
		let fields = [];

		for(let i = 1; i <= nbMaxEmbedField; i++)
		{
			let fieldTitle = interaction.options.getString('field' + i + '-title');
			let fieldDescription = interaction.options.getString('field' + i + '-description');
			let fieldInline = interaction.options.getBoolean('field' + i + '-inline');

			if((fieldTitle == null) && (fieldDescription == null))
			{
				continue;
			}

			let field = 
			{
				title: (fieldTitle == null) ? emptyMessage : fieldTitle,
				description: (fieldDescription == null) ? emptyMessage : fieldDescription,
				inline: (fieldInline == null) ? false : fieldInline
			}

			fields.push(field);
		}

		if(title != null)
		{
			embed.setTitle(title);
		}

		if(description != null)
		{
			embed.setDescription(description);
		}

		for(let i = 0; i < fields.length; i++)
		{
			embed.addField(fields[i].title, fields[i].description, fields[i].inline);
		}

		if(embed.length == 0)
		{
			interaction.reply({content: 'Embed cannot be empty', ephemeral: true});
		}
		else
		{
			if(message == null)
			{
				await interaction.channel.send({ embeds: [embed] });
			}
			else
			{
				await message.edit({ embeds: [embed] });
			}
			
			interaction.reply({content: 'Embed generated', ephemeral: true});
		}
	}
});

allCommands.push({
	data: new SlashCommandBuilder()
			.setName('purge')
			.setDescription('Purge messages')
			.addSubcommand(subcommand =>
				subcommand
					.setName('messages')
					.setDescription('Purge any number of messages')
					.addIntegerOption(option => 
						option
							.setName('number')
							.setDescription('Number of messages to purge')
							.setRequired(true)
					)
				)
			.addSubcommand(subcommand =>
				subcommand
					.setName('channel')
					.setDescription('Purge all message of a channel')
				),

	async execute(interaction, dataManager) {
		dataManager.initGuildData(interaction.guild.id);

		if(!interaction.member.permissions.has("ADMINISTRATOR"))
		{
			await interaction.reply({ content: 'You don\'t have permission for this command', ephemeral: true });
			return;
		}

		let subcommand = interaction.options.getSubcommand();
		await interaction.deferReply({ ephemeral: true });

		switch(subcommand)
		{
			case 'messages':
			{
				let number = interaction.options.getInteger('number');
				let messages = await interaction.channel.messages.fetch({limit: Math.min(100, number)});

				if(messages.size > 0)
				{
					await interaction.channel.bulkDelete(messages);
				}

				await interaction.editReply('Remove ' + messages.size + ' messages');
				break;
			}

			case 'channel':
			{
				let messages = await interaction.channel.messages.fetch({limit: 100});
				let nbMessages = 0;

				while(messages.size > 0)
				{
					nbMessages += messages.size;
					await interaction.channel.bulkDelete(messages);
					messages = await interaction.channel.messages.fetch({limit: 100});
				}

				await interaction.editReply('Remove ' + nbMessages + ' messages');
				break;
			}
		}
	}
});

module.exports = {
	allCommands
};