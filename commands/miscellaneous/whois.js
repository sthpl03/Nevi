const { UserFlags } = require('discord.js');
const { token } = require('../../config.json');
const fetch = require('node-fetch');
const ms = require('ms');

module.exports = {
    name: 'whois',
    aliases: ['userinfo'],
    description: 'Gets the information of the specified user.',
    usage: '(user)',
    examples: [
        '@Nevysian#2014',
    ],
    async execute(bot, msg, args, functions) {
        const user = (msg.mentions.users.first() || { id: (args[0] || '').replace(/\D/g, '') || msg.author.id }).id;
        const emoji = '<:discordIcon:848302098928238603>';
        const discord_api = await fetch(`https://discord.com/api/v8/users/${user}`, { headers: { 'Authorization': `Bot ${token}` } }).then(res => res.json());
        if(discord_api.code == 10013) return functions.send_embed(msg, 'You didn\'t specify a valid user.');
        if(discord_api.code) return functions.send_embed(msg, `There was a problem while fetching the discord api | Error: \`${discord_api.message}\``);
        const created_timestamp = user / 4194304 + 1420070400000;
        const extension = (discord_api.avatar || '').startsWith('a_') ? 'gif' : 'png';
        const avatar = discord_api.avatar ? `https://cdn.discordapp.com/avatars/${user}/${discord_api.avatar}.${extension}` : `https://cdn.discordapp.com/embed/avatars/${discord_api.discriminator % 5}.png`;
        const member = msg.guild.members.cache.get(user);
        const user_data = {
            roles: member ? member.roles.cache.array().sort((a, b) => b.position - a.position) : ['@everyone'],
            badges: new UserFlags(discord_api.public_flags).toArray().map(badge => {
                return badge.split('_').map(b => b[0].toUpperCase() + b.slice(1).toLowerCase()).join(' ');
            }),
        };
        const user_info = functions.embed(msg.author, { title: `${emoji} ${discord_api.username}#${discord_api.discriminator}` })
        .setURL(`https://discord.com/users/${user}`)
        .setThumbnail(avatar)
        .addField('ID', discord_api.id, true)
        .addField('Bot', discord_api.bot ? 'Yes' : 'No', true)
        .addField(`Roles [${user_data.roles.length}]`, user_data.roles.join(', '))
        .addField(`Badges [${user_data.badges.length}]`, user_data.badges.join(', ') || 'This user doesn\'t have any badges')
        .addField('Created At', functions.to_date(created_timestamp), true)
        .addField('Joined At', member ? functions.to_date(member.joinedAt) : 'Unknown', true)
        .addField('Account Age', ms(Date.now() - created_timestamp, { long: true }), true)
        .setColor('#5865F2');
        msg.channel.send(user_info);
    },
};