const { token } = require('../../config.json');
const fetch = require('node-fetch');
const ms = require('ms');

module.exports = {
    name: 'rover',
    aliases: ['roblox'],
    description: 'Gets the information of the specified user\'s linked roblox account.',
    usage: '(user)',
    examples: [
        '@Nevysian#2014',
    ],
    arguments: true,
    cooldown: '5s',
    async execute(bot, msg, args, functions) {
        const user = (msg.mentions.users.first() || { id: args[0].replace(/\D/g, '') }).id;
        if(!user) return functions.send_embed(msg, 'You didn\'t specify a valid user.');
        const discord_api = await fetch(`https://discord.com/api/v8/users/${user}`, { headers: { 'Authorization': `Bot ${token}` } }).then(res => res.json());
        if(discord_api.code == 10013) return functions.send_embed(msg, 'You didn\'t specify a valid user.');
        if(discord_api.code) return functions.send_embed(msg, `There was a problem while fetching the discord api | Error: \`${discord_api.message}\``);
        const rover_api = await fetch(`https://verify.eryn.io/api/user/${user}`).then(res => res.json());
        if(rover_api.errorCode == 404) return functions.send_embed(msg, 'The specified user doesn\'t have a linked roblox account.');
        if(rover_api.errorCode) return functions.send_embed(msg, `There was an error while fetching the rover api | Error: \`${discord_api.error}\``);
        const users_api = await fetch(`https://users.roblox.com/v1/users/${rover_api.robloxId}`).then(res => res.json());
        if(users_api.isBanned) return functions.send_embed(msg, 'The specified user\'s roblox account has been banned.');
        const status_api = await fetch(`https://api.roblox.com/users/${rover_api.robloxId}/onlinestatus/`).then(res => res.json());
        const roblox_emoji = '<:robloxIcon:724025353944694785>';
        const user_information = {
            avatar: `https://www.roblox.com/bust-thumbnail/image?userId=${rover_api.robloxId}&width=420&height=420&format=png`,
            account_age: ms(Date.now() - new Date(users_api.created).getTime(), { long: true }),
        };
        const roblox_info = functions.embed(msg.author, { title: `${roblox_emoji} ${discord_api.username}#${discord_api.discriminator}` })
        .setURL(`https://www.roblox.com/users/${rover_api.robloxId}/profile`)
        .setThumbnail(user_information.avatar)
        .addField('Username', rover_api.robloxUsername, true)
        .addField('ID', rover_api.robloxId, true)
        .addField('Status', status_api.LastLocation, true)
        .addField('Last Online', functions.to_date(status_api.LastOnline), true)
        .addField('Joined At', functions.to_date(users_api.created), true)
        .addField('Account Age', user_information.account_age, true)
        .setColor('#dc2625');
        msg.channel.send(roblox_info);
    },
};