const Config = require('../../config.json');
const ms = require('ms');

module.exports = {
    name: 'botinfo',
    aliases: ['invite'],
    description: 'Gets the information of the bot.',
    cooldown: '10s',
    execute(bot, msg, args, functions) {
        const promises = [
            bot.shard.fetchClientValues('guilds.cache.size'),
            bot.shard.broadcastEval('this.users.cache.filter(user => user.bot).size'),
            bot.shard.fetchClientValues('users.cache.size'),
        ];
        Promise.all(promises).then(result => {
            const bot_data = {
                guild_count: result[0].reduce((prev, current) => prev + current, 0),
                users: {
                    'Non Bots': 0,
                    'Bots': result[1].reduce((prev, current) => prev + current, 0),
                    'Total': result[2].reduce((prev, current) => prev + current, 0),
                },
                links: {
                    'Invite Me!': Config.invite,
                    'Vote Me!': Config.vote_link,
                    'Community & Support Server': Config.server_invite,
                },
            };
            bot_data.users['Non Bots'] = bot_data.users['Total'] - bot_data.users['Bots'];
            const bot_info = functions.embed(msg.author)
            .setDescription('Nevi is a multi-purpose discord bot that will help you make your server how you want it, with verification, moderation, customization and much more so you can make the server you dreamed of.')
            .setThumbnail(bot.user.displayAvatarURL({ dynamic: true }))
            .addField('Users', Object.keys(bot_data.users).map(k => `**- ${k}:** ${bot_data.users[k].toLocaleString()}`))
            .addField('Guilds', bot_data.guild_count, true)
            .addField('Version', Config.version, true)
            .addField('Uptime', ms(bot.uptime, { long: true }), true)
            .addField('Current Shard', msg.guild.shardID, true)
            .addField('Total Shards', bot.shard.count, true)
            .addField('Links', Object.keys(bot_data.links).map(k => `- [${k}](${bot_data.links[k]})`))
            .addField('Started At', functions.to_date(bot.readyAt), true)
            .addField('Created At', functions.to_date(bot.user.createdAt), true);
            msg.channel.send(bot_info);
        });
    },
};