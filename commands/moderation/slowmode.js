const { MessageEmbed } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'slowmode',
    description: 'Sets the slowmode for the duration given in the specified or the current channel.',
    usage: '(channel) (duration)',
    examples: [
        '5s',
        '#general 5s',
    ],
    permissions: ['MANAGE_CHANNELS'],
    cooldown: '3s',
    execute(bot, msg, args, functions) {
        let channel = msg.guild.channels.cache.get(args[0]) || msg.mentions.channels.first();
        if(channel) args.splice(0, 1);
        else channel = msg.channel;
        const slowmode = Math.floor(ms(args[0] || '0') / 1000) || Number(args[0]) || 0;
        const readable_slowmode = ms(slowmode * 1000, { long: true });
        if(!channel.manageable) return functions.send_embed(msg, 'I don\'t have permissions to make changes to that channel.');
        if(channel.rateLimitPerUser == slowmode) return functions.send_embed(msg, 'That channel\'s slowmode has already been set to that.');
        if(slowmode > 21600) return functions.send_embed(msg, 'The slowmode can\'t be longer than `6 hours`.');
        channel.setRateLimitPerUser(slowmode).then(() => {
            if(!slowmode) functions.send_embed(msg, `${channel}'s slowmode has been disabled.`);
            else functions.send_embed(msg, `${channel}'s slowmode has been set to \`${readable_slowmode}\`.`);
            const commang_log = new MessageEmbed()
            .setDescription(`A channel's slowmode has been changed by ${msg.author}`)
            .addField('Author', msg.author, true)
            .addField('Channel', channel, true)
            .addField('Slowmode', slowmode ? readable_slowmode : 'Disabled', true);
            functions.log_command(this.name, commang_log, msg);
        }, e => {
            functions.send_embed(msg, `There was a problem while changing that channel's slowmode | Error: \`${e.message}\``);
        });
    },
};