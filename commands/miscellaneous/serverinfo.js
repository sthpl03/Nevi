module.exports = {
    name: 'serverinfo',
    aliases: ['guildinfo'],
    description: 'Gets the info of the current guild.',
    cooldown: '10s',
    execute(bot, msg, args, functions) {
        const guild = msg.guild;
        function channel_size(type) {
            return guild.channels.cache.filter(channel => channel.type == type).size;
        }
        const lists = {
            members: {
                'Non Bots': 0,
                'Bots': guild.members.cache.filter(member => member.user.bot).size,
                'Total': guild.memberCount,
            },
            channels: {
                'Text': channel_size('text'),
                'Voice': channel_size('voice'),
                'Category': channel_size('category'),
                'AFK Channel': guild.afkChannel || 'Not set',
                'System Channel': guild.systemChannel || 'Not set',
            },
        };
        lists.members['Non Bots'] = guild.memberCount - lists.members['Bots'];
        const server_info = functions.embed(msg.author, { title: guild.name })
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addField('Owner', guild.owner, true)
        .addField('Roles', guild.roles.cache.size, true)
        .addField(`Emojis [${guild.emojis.cache.size}]`, guild.emojis.cache.array().join(' ') || 'This server doesn\'t have any emojis')
        .addField('Members', Object.keys(lists.members).map(k => `**- ${k}:** ${lists.members[k].toLocaleString()}`), true)
        .addField('Channels', Object.keys(lists.channels).map(k => `**- ${k}:** ${lists.channels[k]}`), true)
        .addField('Created At', functions.to_date(guild.createdAt));
        msg.channel.send(server_info);
    },
};