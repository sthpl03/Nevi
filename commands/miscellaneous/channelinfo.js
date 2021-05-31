const ms = require('ms');

module.exports = {
    name: 'channelinfo',
    description: 'Gets the information of the specified or current channel.',
    usage: '(channel)',
    examples: [
        '#general',
    ],
    cooldown: '5s',
    execute(bot, msg, args, functions) {
        const channel = msg.mentions.channels.first() || msg.guild.channels.cache.get(args[0]) || msg.channel;
        const channel_info = functions.embed(msg.author, { title: channel.name })
        .addField('ID', channel.id, true)
        .addField('Type', channel.type, true)
        .addField('Position', channel.position, true)
        .addField('Slowmode', channel.rateLimitPerUser ? ms(channel.rateLimitPerUser * 1000, { long: true }) : 'Disabled', true)
        .addField('NSFW', channel.nsfw ? 'Yes' : 'No', true)
        .addField('Parent', channel.parent || 'This channel doesn\'t have a parent', true)
        .addField('Topic', channel.topic || 'This channel doesn\'t have a topic', true)
        .addField('Created At', functions.to_date(channel.createdAt), true);
        msg.channel.send(channel_info);
    },
};