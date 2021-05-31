const { MessageEmbed } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'temprole',
    description: 'Gives the role given to the specified member for the duration and reason given.',
    usage: '(member) (duration) (role), (reason)',
    examples: [
        '@Nevysian#2014 1d Trial Mod',
        '@Nevysian#2014 1d Trial Mod, Application Accepted!',
    ],
    arguments: true,
    permissions: ['MANAGE_ROLES'],
    execute(bot, msg, args, functions, db) {
        const member = msg.guild.members.cache.get(args[0]) || msg.mentions.members.first();
        const duration = ms(args[1] || '0') || 0;
        const role = msg.guild.roles.cache.get((args[2] || '').split(',')[0]) || msg.guild.roles.cache.find(r => r.name.toLowerCase().includes(args.slice(2).join(' ').split(', ')[0].toLowerCase()));
        const reason = args.slice(2).join(' ').split(', ').slice(1).join(', ') || 'No reason given.';
        if(!member) return functions.send_embed(msg, 'You didn\'t specify a valid member.');
        if(!duration || duration >= ms('3w')) return functions.send_embed(msg, 'You didn\'t specify a valid duration.');
        if(!role || role.id == msg.guild.roles.everyone.id) return functions.send_embed(msg, 'You didn\'t specify a valid role.');
        if(role.position >= msg.member.roles.highest.position) return functions.send_embed(msg, 'You don\'t have permissions to make changes to that role.');
        if(!role.editable) return functions.send_embed(msg, 'I don\'t have permissions to make changes to that role.');
        if(member.roles.cache.has(role.id)) return functions.send_embed(msg, 'That member already has that role.');
        db.query(`SELECT * FROM roles WHERE guild_id = '${msg.guild.id}' AND member_id = '${member.id}' AND role_id = '${role.id}'`, (err, roles) => {
            if(err) return functions.log_error(err);
            let sql;
            member.roles.add(role, reason).then(() => {
                const fields = {
                    'guild_id': msg.guild.id,
                    'member_id': member.id,
                    'role_id': role.id,
                    'reason': reason,
                    'created_at': Date.now(),
                    'duration': duration,
                };
                if(!roles.length) sql = `INSERT INTO roles (${Object.keys(fields).join(', ')}) VALUES(${Object.values(fields).map(v => db.escape(v)).join(', ')})`;
                else sql = `UPDATE roles SET ${Object.keys(fields).slice(3).map(k => `${k} = ${db.escape(fields[k])}`).join(', ')} WHERE id = ${roles[0].id}`;
                db.query(sql, err => {
                    if(err) return functions.log_error(err);
                    function handle_timeout() {
                        member.roles.remove(role, 'Time ran out').then(() => {
                            db.query(`DELETE FROM roles WHERE id = ${roles[0].id}`);
                        });
                    }
                    setTimeout(handle_timeout, duration);
                    functions.send_embed(msg, `The ${role} role has been given to ${member} for \`${ms(duration, { long: true })}\` | ${reason}`);
                    const command_log = new MessageEmbed()
                    .setDescription(`A member has been temp roled by ${msg.author}`)
                    .addField('Author', msg.author, true)
                    .addField('Victim', member, true)
                    .addField('Role', role, true)
                    .addField('Reason', reason, true)
                    .addField('Duration', ms(duration, { long: true }), true);
                    functions.log_command(this.name, command_log, msg, { guild_id: msg.guild.id, member_id: member.id, log_by: msg.author.id, reason: reason, duration: duration });
                });
            }, e => {
                functions.send_embed(msg, `There was a problem while giving that member that role | Error: \`${e.message}\``);
            });
        });
    },
};