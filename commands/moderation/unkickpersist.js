const { MessageEmbed } = require('discord.js');
const { max_reason_length } = require('../../config.json');

module.exports = {
    name: 'unkickpersist',
    description: 'Unkickpersists the specified user for the reason given.',
    usage: '(user id) (reason)',
    examples: [
        '657702969034407947',
        '657702969034407947 Appeal Accepted!',
    ],
    arguments: true,
    member_permissions: ['KICK_MEMBERS'],
    execute(bot, msg, args, functions, db) {
        const user_id = args[0].replace(/\D/g, '');
        const reason = args.slice(1).join(' ') || 'No reason given.';
        if(!user_id) return functions.send_embed(msg, 'You didn\'t specify a valid user id.');
        if(reason.length > max_reason_length) return functions.send_embed(msg, `The reason can't be longer than \`${max_reason_length}\` characters.`);
        db.query(`DELETE FROM kicks WHERE guild_id = '${msg.guild.id}' AND member_id = '${user_id}'`, (err, kicks) => {
            if(err) return functions.log_error(err);
            if(!kicks.affectedRows) return functions.send_embed(msg, 'That user has already been unkickpersisted.');
            functions.send_embed(msg, `\`${user_id}\` has been unkickpersisted | ${reason}`);
            const command_log = new MessageEmbed()
            .setDescription(`A member has been unkickpersisted by ${msg.author}`)
            .addField('Author', msg.author, true)
            .addField('Victim', `<@!${user_id}> | ${user_id}`, true)
            .addField('Reason', reason, true);
            functions.log_command(this.name, command_log, msg, { guild_id: msg.guild.id, member_id: user_id, log_by: msg.author.id, reason: reason });
        });
    },
};