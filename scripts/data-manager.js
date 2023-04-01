const fs = require('fs');
let directoryPath = "";

let data = {}
let guildDefaultValues = [];

function getServerData(guildId) {
	if(guildId in data)
	{
		return data[guildId];
	}

	return null;
}

function initData(dirName, defaultValues, callBack = null)
{
	directoryPath = dirName;
	fs.mkdirSync(directoryPath, { recursive: true });

	let directoryFiles = fs.readdirSync(directoryPath);
	directoryFiles.forEach(function (file) {
		if(fs.lstatSync(directoryPath + '/' + file).isDirectory())
		{
			return;
		}

		let contents = fs.readFileSync(directoryPath + '/' + file, 'utf8');
		let temp = JSON.parse(contents);
		data[temp.guildId] = temp;

		if(callBack != null)
		{
			callBack(getServerData(temp.guildId), temp.guildId);
		}
	});

	guildDefaultValues = defaultValues;
}

function initGuildValue(guildId, valueName, initValue)
{
	if(!(valueName in data[guildId]))
	{
		data[guildId][valueName] = initValue;
		writeInData(guildId);
	}
}


function initGuildData(guildId)
{
	if(!(guildId in data))
	{
		data[guildId] = {};
	}

	data[guildId].guildId = guildId;

	guildDefaultValues.forEach(value => {
		initGuildValue(guildId, value.name, value.defaultValue);
	});

	writeInData(guildId);
}

function removeGuildData(guildId)
{
	if(!(guildId in data))
	{
		return;
	}

	let path = directoryPath + '/' + guildId;
	if(!fs.existsSync(path))
	{
		return;
	}

	fs.unlinkSync(path);
}

function writeInData(guildId)
{
	let path = directoryPath + '/' + guildId;
	if(fs.existsSync(path))
	{
		fs.unlinkSync(path);
	}

	fs.writeFileSync(path, JSON.stringify(data[guildId], null, 4), 'utf8');
}

function writeInAllData()
{
	Object.keys(data).forEach(key => {
		writeInData(key);
	});
}

module.exports = {
	getServerData,
	initData,
	initGuildData,
	removeGuildData,
	writeInData,
	writeInAllData
}