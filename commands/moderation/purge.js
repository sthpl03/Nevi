const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'purge',
    aliases: ['clear'],
    description: 'Deletes the amount of messages given in the current channel.',
    usage: '(amount)',
    examples: [
        '5',
    ],
    arguments: true,
    permissions: ['MANAGE_MESSAGES'],
    execute(bot, msg, args, functions) {
        const amount = Number(args[0]);
        if(!amount || amount < 1 || amount > 99) return functions.send_embed(msg, 'You didn\'t specify a valid amount.');
        msg.channel.bulkDelete(amount + 1, true).then(deleted_msgs => {
            deleted_msgs.delete(msg.id);
            if(!deleted_msgs.size) return functions.send_embed(msg, 'I didn\'t have any messages to delete.');
            functions.send_embed(msg, `\`${deleted_msgs.size}\` message(s) were deleted in ${msg.channel}`).then(m => {
                m.delete({ timeout: 5000 }).catch(() => true);
            });
            const command_log = new MessageEmbed()
            .setDescription(`Message(s) have been purged by ${msg.author}`)
            .addField('Author', msg.author, true)
            .addField('Channel', msg.channel, true)
            .addField('Amount', deleted_msgs.size, true);
            functions.log_command(this.name, command_log, msg);
        }, e => {
            functions.send_embed(msg, `There was an error while deleting messages in this channel | Error: \`${e.message}\``);
        });
    },
};