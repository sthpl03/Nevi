const { MessageEmbed } = require('discord.js');
const { max_reason_length } = require('../../config.json');

module.exports = {
    name: 'unmute',
    description: 'Unmutes the specified member for the reason given.',
    usage: '(member) (reason)',
    examples: [
        '@Nevysian#2014',
        '@Nevysian#2014 Wrong person.',
    ],
    arguments: true,
    permissions: ['MANAGE_ROLES'],
    cooldown: '5s',
    execute(bot, msg, args, functions, db) {
        const member = msg.guild.members.cache.get(args[0]) || msg.mentions.members.first();
        const reason = args.slice(1).join(' ') || 'No reason given.';
        if(!member) return functions.send_embed(msg, 'You didn\'t specify a valid member.');
        if(reason.length > max_reason_length) return functions.send_embed(msg, `The reason can't be longer than \`${max_reason_length}\` characters.`);
        db.query(`SELECT muted_role FROM guild_settings WHERE guild_id = '${msg.guild.id}'`, (err, guilds) => {
            if(err) return functions.log_error(err);
            const guild_settings = guilds[0] || {
                muted_role: null,
            };
            const muted_role = msg.guild.roles.cache.get(guild_settings.muted_role) || msg.guild.roles.cache.find(role => role.name.toLowerCase() == 'muted');
            if(!muted_role) return functions.send_embed(msg, 'The muted role doesn\'t exist.');
            db.query(`DELETE FROM roles WHERE guild_id = '${msg.guild.id}' AND member_id = '${member.id}' AND role_id = '${muted_role.id}'`, (err, roles) => {
                if(err) return functions.log_error(err);
                if(!member.roles.cache.has(muted_role.id) && !roles.affectedRows) return functions.send_embed(msg, 'That member is already unmuted.');
                member.roles.remove(muted_role, reason).then(() => {
                    functions.send_embed(member, `You have been unmuted in \`${msg.guild.name}\` | ${reason}`);
                    functions.send_embed(msg, `${member} has been unmuted | ${reason}`);
                    const command_log = new MessageEmbed()
                    .setDescription(`A member has been unmuted by ${msg.author}`)
                    .addField('Author', msg.author, true)
                    .addField('Victim', member, true)
                    .addField('Reason', reason, true);
                    functions.log_command(this.name, command_log, msg, { guild_id: msg.guild.id, member_id: member.id, log_by: msg.author.id, reason: reason });
                }, e => {
                    functions.send_embed(msg, `There was a problem while removing the muted role from that member | Error: \`${e.message}\``);
                });
            });
        });
    },
};