const path = require('path');
const fs = require('fs');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const DataManager = require('./scripts/data-manager.js');
const { clientId, token } = require('./config.json');
const DiscordUtils = require('./scripts/discord-utils.js');

const needRefreshCommands = true;
const sendInitError = true;

const guildValues = 
[
	{name : 'errorLogChannel', defaultValue : -1},
];

const rest = new REST({ version: '9' }).setToken(token);
const client = new Client({ intents: 
	[
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages
	] 
});

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

client.commands = new Collection();
let commandData = [];

for (const file of commandFiles) {
	let commands = require(`./commands/${file}`);
	const allCommands = commands.allCommands;

	for(let i = 0; i < allCommands.length; i++)
	{
		client.commands.set(allCommands[i].data.name, allCommands[i]);
		commandData.push(allCommands[i].data.toJSON());
	}
}

DataManager.initData(path.join(__dirname, 'data'), guildValues);

let isInit = false;

client.on('ready', async function () {
	console.log("Connected");

	if (!client.application?.owner) await client.application?.fetch();

	await refreshCommands();

	client.on('interactionCreate', async function(interaction)
	{
		if(!interaction.isCommand())
		{
			return;
		}

		const command = client.commands.get(interaction.commandName);

		if (!command)
		{
			return;
		}

		try 
		{
			await command.execute(interaction, DataManager);
		} 
		catch (executionError) {
			console.error(executionError);
			try 
			{
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
				DataManager.logError(interaction.guild, 'Command Error :\n\n' + executionError);
			} 
			catch(replyError)
			{
				try 
				{
					await interaction.editReply('There was an error while executing this command!');
					DataManager.logError(interaction.guild, 'Command Error :\n\n' + replyError);
				}
				catch(cantReplyError)
				{
					DataManager.logError(interaction.guild, 'Answer is too long');
				}
			}
		}
	});

	client.on('guildCreate', function(guild)
	{
		DataManager.initGuildData(guild.id);
		refreshCommandForGuild(guild);
	});

	client.on('guildDelete', function(guild)
	{
		DataManager.removeGuildData(guild.id);
	});

	await client.guilds.fetch();

	if(isInit)
	{
		return;
	}

	client.guilds.cache.forEach(async (guild) => {
		if(sendInitError)
		{
			DataManager.logError(guild, 'Init error');
		}
	});
	
	isInit = true;
});

async function refreshCommands()
{
	await client.guilds.fetch();

	for(let[guildId, guild] of client.guilds.cache)
	{
		if(needRefreshCommands || DataManager.getServerData(guildId) == null)
		{
			DataManager.initGuildData(guildId);
			await refreshCommandForGuild(guild);
		}
	}
}

async function refreshCommandForGuild(guild)
{
	try
	{
		await rest.put(Routes.applicationGuildCommands(clientId, guild.id), { body: commandData });
		console.log('Successfully registered application commands for guild ' + guild.name);
	}
	catch(error)
	{
		console.log('Can\'t registered command for guild ' + guild.name + ': ' + error);
	}
}

async function logError(guild, error)
{
	let guildData = DataManager.getServerData(guild.id);
	let channel = await DiscordUtils.getChannelById(guild.client, guildData.errorLogChannel);

	if(channel != null)
	{
		channel.send('Info: ' + error);
	}
}

DataManager.refreshCommandForGuild = refreshCommandForGuild;
DataManager.logError = logError;

client.login(token);