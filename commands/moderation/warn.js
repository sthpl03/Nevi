const { MessageEmbed } = require('discord.js');
const { max_reason_length } = require('../../config.json');

module.exports = {
    name: 'warn',
    aliases: ['givewarning', 'givewarn'],
    description: 'Warns the specified member for the reason given.',
    usage: '(member) (reason)',
    examples: [
        '@Nevysian#2014 Breaking the rules!',
    ],
    arguments: true,
    member_permissions: ['MANAGE_ROLES'],
    execute(bot, msg, args, functions, db) {
        const member = msg.guild.members.cache.get(args[0]) || msg.mentions.members.first();
        const reason = args.slice(1).join(' ');
        if(!member) return functions.send_embed(msg, 'You didn\'t specify a valid member.');
        if(!reason) return functions.send_embed(msg, 'You didn\'t specify a reason.');
        if(reason.length > max_reason_length) return functions.send_embed(msg, `The reason can't be longer than \`${max_reason_length}\` characters.`);
        db.query(`INSERT INTO warnings(guild_id, member_id, warned_by, reason, created_at) VALUES('${msg.guild.id}', '${member.id}', '${msg.author.id}', ${db.escape(reason)}, ${Date.now()})`, err => {
            if(err) return functions.log_error(err);
            functions.send_embed(member, `You have been warned in \`${msg.guild.name}\` | ${reason}`);
            functions.send_embed(msg, `${member} has been warned | ${reason}`);
            const command_log = new MessageEmbed()
            .setDescription(`A member has been warned by ${msg.author}`)
            .addField('Author', msg.author, true)
            .addField('Victim', member, true)
            .addField('Reason', reason, true);
            functions.log_command(this.name, command_log, msg, { guild_id: msg.guild.id, member_id: member.id, log_by: msg.author.id, reason: reason });
        });
    },
};