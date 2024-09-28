import { EmbedBuilder } from 'discord.js';

let reactNumberArray = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export function getUserStringById(id)
{
	return "<@!" + id + ">";
}

export async function getGuildById(client, id)
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

export async function getMemberById(guild, id)
{
	let members = await guild.members.fetch();
	return members.get(id);
}

export async function getRoleById(guild, id)
{
	return await guild.roles.fetch(id);
}

export async function getUserNameById(guild, id)
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
	else if(("globalName" in member.user) && (member.user.globalName != null))
	{
		result = member.user.globalName;
	}
	else
	{
		result = member.user.username;
	}

	return result;
}

export async function getUserBaseNameById(guild, id)
{
	let user = await getMemberById(guild, id);

	if(user == null)
	{
		return "Unknow";
	}

	return user.user.username;
}

export async function getUserTagById(guild, id)
{
	let user = await getMemberById(guild, id);

	if(user == null)
	{
		return "Unknow";
	}

	return user.user.tag;
}

export async function getRoleNameById(guild, id)
{
	let role = await getRoleById(guild, id);

	if(role == null)
	{
		return "Unknow";
	}
	
	return role.name;
}

export function getRoleStringById(id)
{
	return "<@&" + id + ">";
}

export function getUserIdByString(string)
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

export function getRoleIdByString(string)
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

export async function getChannelById(client, id)
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

export function getChannelStringById(id)
{
	return "<#" + id + ">";
}

export function getChannelIdByString(string)
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

export async function getMessageById(client, channelId, messageId)
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

export function hasMemberRole(guildMember, roleId)
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

export function createEmbedMessage(message, color = null)
{
	let embed = new EmbedBuilder();
	embed.setDescription(message);
	return embed;
}

export async function editMessageById(client, channelId, messageId, newMessage)
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

export function getReactFromNumber(number)
{
	return reactNumberArray[number];
}