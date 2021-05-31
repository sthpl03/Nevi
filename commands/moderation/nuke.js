const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'nuke',
    description: 'Clones and deletes the specified channel for the reason given to delete all of its messages.',
    usage: '(channel) (reason)',
    examples: [
        '#general',
        '#general Cleaning the channel.',
    ],
    permissions: ['MANAGE_CHANNELS'],
    cooldown: '10s',
    arguments: true,
    execute(bot, msg, args, functions) {
        const channel = msg.guild.channels.cache.get(args[0]) || msg.mentions.channels.first();
        const reason = args.slice(1).join(' ') || 'No reason given.';
        if(!channel || channel.id == msg.channel.id) return functions.send_embed(msg, 'You didn\'t specify a valid channel.');
        if(!channel.deletable || !channel.manageable) return functions.send_embed(msg, 'I don\'t have permissions to make changes to that channel.');
        if(reason.length > 1024) return functions.send_embed(msg, 'The reason can\'t be longer than `1024` characters.');
        functions.confirmation(msg, () => {
            channel.clone({ reason: reason }).then(new_channel => {
                channel.delete().then(() => {
                    functions.send_embed(msg, `That channel has been nuked, here is the new channel: ${new_channel}.`);
                    const command_log = new MessageEmbed()
                    .setDescription(`A channel has been nuked by ${msg.author}`)
                    .addField('Author', msg.author, true)
                    .addField('Old Channel', `${channel.name} | ${channel.id}`, true)
                    .addField('New Channel', new_channel, true)
                    .addField('Reason', reason, true);
                    functions.log_command(this.name, command_log, msg);
                }, e => {
                    functions.send_embed(msg, `There was a problem while deleting that channel | Error: \`${e.message}\``);
                });
            }, e => {
                functions.send_embed(msg, `There was a problem while cloning that channel | Error: \`${e.message}\``);
            });
        });
    },
};