const { MessageEmbed } = require('discord.js');
const { max_reason_length } = require('../../config.json');

module.exports = {
    name: 'unban',
    description: 'Unbans the specified member from the guild with the reason given.',
    usage: '(member) (reason)',
    examples: [
        '@Nevysian#2014',
        '@Nevysian#2014 Ban Appeal Accepted!',
    ],
    arguments: true,
    permissions: ['BAN_MEMBERS'],
    cooldown: '5s',
    execute(bot, msg, args, functions, db) {
        const user_id = args[0].replace(/\D/g, '');
        const reason = args.slice(1).join(' ') || 'No reason given.';
        if(!user_id) return functions.send_embed(msg, 'You didn\'t specify a valid user id.');
        if(reason.length > max_reason_length) return functions.send_embed(msg, `The reason can't be longer than \`${max_reason_length}\` characters.`);
        msg.guild.members.unban(user_id, reason).then(user_tag => {
            if(user_tag) user_tag = user_tag.tag;
            db.query(`DELETE FROM bans WHERE guild_id = '${msg.guild.id}' AND member_id = '${user_id}'`, err => {
                if(err) return functions.log_error(err);
                functions.send_embed(msg, `\`${user_tag || user_id}\` has been unbanned | ${reason}`);
                const command_log = new MessageEmbed()
                .setDescription(`A member has been unbanned by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Victim', `${user_tag || `<@!${user_id}>`} | ${user_id}`, true)
                .addField('Reason', reason, true);
                functions.log_command(this.name, command_log, msg, { guild_id: msg.guild.id, member_id: user_id, log_by: msg.author.id, reason: reason });
            });
        }, e => {
            if(e.code == 10013) return functions.send_embed(msg, 'You didn\'t specify a valid user.');
            if(e.code == 10026) return functions.send_embed(msg, 'That user has already been unbanned.');
            functions.send_embed(msg, `There was a problem while unbanning that member | Error: \`${e.message}\``);
        });
    },
};