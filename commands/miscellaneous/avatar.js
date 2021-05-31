const { token } = require('../../config.json');
const fetch = require('node-fetch');

module.exports = {
    name: 'avatar',
    aliases: ['av', 'pfp'],
    description: 'Gets the avatar/profile picture of the specified user.',
    usage: '(user)',
    examples: [
        '@Nevysian#2014',
    ],
    async execute(bot, msg, args, functions) {
        const user = (msg.mentions.users.first() || { id: args[0].replace(/\D/g, '') || msg.author.id }).id;
        const discord_api = await fetch(`https://discord.com/api/v8/users/${user}`, { headers: { 'Authorization': `Bot ${token}` } }).then(res => res.json());
        if(discord_api.code == 10013) return functions.send_embed(msg, 'You didn\'t specify a valid user.');
        if(discord_api.code) return functions.send_embed(msg, `There was a problem while fetching the discord api | Error: \`${discord_api.message}\``);
        const extension = (discord_api.avatar || '').startsWith('a_') ? 'gif' : 'png';
        const avatar = (discord_api.avatar ? `https://cdn.discordapp.com/avatars/${user}/${discord_api.avatar}.${extension}` : `https://cdn.discordapp.com/embed/avatars/${discord_api.discriminator % 5}.png`) + '?size=4096';
        const avatar_info = functions.embed(msg.author, { title: `${discord_api.username}#${discord_api.discriminator}` })
        .setURL(avatar)
        .setImage(avatar);
        msg.channel.send(avatar_info);
    },
};