const { EmbedBuilder } = require('discord.js');

let reactNumberArray = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

function getUserStringById(id)
{
	return "<@!" + id + ">";
}

async function getGuildById(client, id)
{
	await client.guilds.fetch();

	for(let i = 0; i < client.guilds.cache.size; i++)
	{
		let guild = client.guilds.cache.at(i);

		if(guild.id == id)
		{
			return guild;
		}
	}

	return null;
}

async function getMemberById(guild, id)
{
	let members = await guild.members.fetch();
	return members.get(id);
}

async function getRoleById(guild, id)
{
	return await guild.roles.fetch(id);
}

async function getUserNameById(guild, id)
{
	let member = await getMemberById(guild, id);
	let result = "Unknow";

	if(member == null)
	{
		return "Unknow";
	}
	
	if(("nickname" in member) && (member.nickname != null))
	{
		result = member.nickname;
	}
	else
	{
		result = member.user.username;
	}

	return result;
}

async function getUserBaseNameById(guild, id)
{
	let user = await getMemberById(guild, id);

	if(user == null)
	{
		return "Unknow";
	}

	return user.user.username;
}

async function getUserTagById(guild, id)
{
	let user = await getMemberById(guild, id);

	if(user == null)
	{
		return "Unknow";
	}

	return user.user.tag;
}

async function getRoleNameById(guild, id)
{
	let role = await getRoleById(guild, id);

	if(role == null)
	{
		return "Unknow";
	}
	
	return role.name;
}

function getRoleStringById(id)
{
	return "<@&" + id + ">";
}

function getUserIdByString(string)
{
	let result = -1;

	if(string.substring(0, 3) == "<@!")
	{
		if(string[string.length - 1] == ">")
		{
			result = string.substring(3, string.length - 1);
		}
	}
	else if((string.substring(0, 2) == "<@") && (string[2] != '&'))
	{
		if(string[string.length - 1] == ">")
		{
			result = string.substring(2, string.length - 1);
		}
	}

	return result;
}

function getRoleIdByString(string)
{
	let result = -1;

	if(string.substring(0, 3) == "<@&")
	{
		if(string[string.length - 1] == ">")
		{
			result = string.substring(3, string.length - 1);
		}
	}
	return result;
}

async function getChannelById(client, id)
{
	try
	{
		return await client.channels.fetch(id);
	}
	catch(error)
	{
		return null;
	}
}

function getChannelStringById(id)
{
	return "<#" + id + ">";
}

function getChannelIdByString(string)
{
	let result = -1;

	if(string.substring(0, 2) == "<#")
	{
		if(string[string.length - 1] == ">")
		{
			result = string.substring(2, string.length - 1);
		}
	}
	return result;
}

async function getMessageById(client, channelId, messageId)
{
	let channel = await getChannelById(client, channelId);
	if(channel == null)
	{
		return null;
	}

	let message;

	try
	{
		message = await channel.messages.fetch(messageId);
	}
	catch(error)
	{
		message = null;
	}

	return message;
}

function hasMemberRole(guildMember, roleId)
{
	for(let i = 0; i < guildMember.roles.cache.size; i++)
	{
		let role = guildMember.roles.cache.at(i);

		if(role.id == roleId)
		{
			return true;
		}
	}

	return false;
}

function createEmbedMessage(message, color = null)
{
	let embed = new EmbedBuilder();
	embed.setDescription(message);
	return embed;
}

async function editMessageById(client, channelId, messageId, newMessage)
{
	let message = await getMessageById(client, channelId, messageId);

	if(message != null)
	{
		if(!("edit" in message))
		{
			return;
		}

		message.edit(newMessage);
	}
}

function getReactFromNumber(number)
{
	return reactNumberArray[number];
}

module.exports = {
	getUserStringById,
	getGuildById,
	getMemberById,
	getRoleById,
	getUserNameById,
	getUserBaseNameById,
	getUserTagById,
	getRoleNameById,
	getRoleStringById,
	getChannelById,
	getChannelStringById,
	getMessageById,

	getUserIdByString,
	getRoleIdByString,
	getChannelIdByString,

	hasMemberRole,
	createEmbedMessage,
	editMessageById,
	getReactFromNumber,
}