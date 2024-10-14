import path from 'path';
import fs from 'fs';
import { Client, Events, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import DataManager from './scripts/data-manager.js';
import * as DiscordUtils from './scripts/discord-utils.js';
import { exit } from 'process';

const needRefreshCommands = true;

const client = new Client({ intents: 
	[
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions
	] 
});

const config = JSON.parse(fs.readFileSync('./config.json'));

let commandData = [];
let dynamicCommandData = [];
let rest = null;

async function init()
{
	if(!fs.existsSync('config.json'))
	{
		let basic_config = {};
		basic_config.clientId = "";
		basic_config.token = "";
		basic_config.errorLogGuild = "";

		fs.writeFileSync('config.json', JSON.stringify(basic_config, null, 4));

		console.log('Need to fill config.json with discord bot informations');
		exit(0);
	}

	if(!('clientId' in config) || !('token' in config))
	{
		if(!('clientId' in config))
		{
			config.clientId = "";
		}

		if(!('token' in config))
		{
			config.token = "";
		}

		fs.writeFileSync('config.json', JSON.stringify(config, null, 4));
		console.log('Need to fill config.json with discord bot informations');
		return;
	}

	if(config.clientId.length == 0 || config.token.length == 0)
	{
		console.log('Need to fill config.json with discord bot informations');
		exit(0);
	}

	if(!('errorLogGuild' in config) || config.errorLogGuild.length == 0)
	{
		config.errorLogGuild = "";
		fs.writeFileSync('config.json', JSON.stringify(config, null, 4));
		console.log('No error log guild specified');
	}

	if(!('sendInitError' in config))
	{
		config.sendInitError = true;
		fs.writeFileSync('config.json', JSON.stringify(config, null, 4));
	}

	if(!('caughtException' in config))
	{
		config.caughtException = true;
		fs.writeFileSync('config.json', JSON.stringify(config, null, 4));
	}

	const guildValues = 
	[
		{name : 'errorLogChannel', defaultValue : -1},
	];

	rest = new REST({ version: '9' }).setToken(config.token);

	const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

	client.commands = new Collection();

	for (const file of commandFiles) {
		let commands = await import(`./commands/${file}`);
		const allCommands = commands.allCommands;

		for(let i = 0; i < allCommands.length; i++)
		{
			if('dynamicCommandCreator' in allCommands[i])
			{
				dynamicCommandData.push({name: allCommands[i].data.name, creator: allCommands[i].dynamicCommandCreator});
			}
			else
			{
				commandData.push(allCommands[i].data.toJSON());
			}

			client.commands.set(allCommands[i].data.name, allCommands[i]);
		}
	}

	if(process.platform === 'win32')
	{
		DataManager.initData(path.join(import.meta.dirname, 'data'), guildValues);
	}
	else
	{
		DataManager.initData(path.join(path.dirname(import.meta.url), 'data'), guildValues);
	}

	let isInit = false;

	client.on(Events.ClientReady, async function () {
		console.log("Connected");

		if (!client.application?.owner) await client.application?.fetch();

		await refreshCommands();

		client.on(Events.InteractionCreate, async function(interaction)
		{
			if(!interaction.isCommand() && !interaction.isUserContextMenuCommand())
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
					DataManager.logError(interaction.guild, 'Command ' + interaction.commandName + ' Error :\n\n' + executionError);
				} 
				catch(replyError)
				{
					try 
					{
						await interaction.editReply('There was an error while executing this command!');
						DataManager.logError(interaction.guild, 'Command ' + interaction.commandName + ' Error :\n\n' + replyError + '\n' + executionError);
					}
					catch(cantReplyError)
					{
						DataManager.logError(interaction.guild, 'Command ' + interaction.commandName + ' Error : Answer is too long');
					}
				}
			}
		});

		client.on(Events.GuildCreate, function(guild)
		{
			DataManager.initGuildData(guild.id);
			refreshCommandForGuild(guild);
		});

		client.on(Events.GuildDelete, function(guild)
		{
			DataManager.removeGuildData(guild.id);
		});

		await client.guilds.fetch();

		if(isInit)
		{
			return;
		}

		client.guilds.cache.forEach(async (guild) => {
			if(config.sendInitError)
			{
				DataManager.logError(guild, 'Bot Starting');
			}
		});
		
		isInit = true;
	});

	if(config.caughtException && config.errorLogGuild.length > 0)
	{
		process.once('uncaughtException', async function (err)
		{
			await DataManager.logError(await DiscordUtils.getGuildById(client, config.errorLogGuild), 'Uncaught exception: ' + err);
			console.log('Uncaught exception: ' + err);
			exit(1);
		});
	}
	
	DataManager.refreshCommandForGuild = refreshCommandForGuild;
	DataManager.logError = logError;
	
	client.login(config.token);
}

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
	let guildCommandData = commandData.map(x => x);
	for(let i = 0; i < dynamicCommandData.length; i++)
	{
		let data = dynamicCommandData[i].creator(dynamicCommandData[i].name, DataManager, guild);
		if(data == null)
		{
			continue;
		}

		guildCommandData.push(data.toJSON());
	}

	try
	{
		await rest.put(Routes.applicationGuildCommands(config.clientId, guild.id), { body: guildCommandData });
		console.log('Successfully registered application commands for guild ' + guild.name);
	}
	catch(error)
	{
		console.log('Can\'t registered command for guild ' + guild.name + ': ' + error);
	}
}

async function logError(guild, error)
{
	if(guild == null)
	{
		return;
	}
	
	let guildData = DataManager.getServerData(guild.id);
	let channel = await DiscordUtils.getChannelById(guild.client, guildData.errorLogChannel);

	if(channel != null)
	{
		try
		{
			await channel.send('Info: ' + error);
		}
		catch(error)
		{
			console.log('Can\'t log error : ' + error);
		}
	}
}

init();