const { MessageEmbed } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'ban',
    description: 'Bans the specified member from the guild for the reason and duration given.',
    usage: '(member) (duration) (reason)',
    examples: [
        '@Nevysian#2014',
        '@Nevysian#2014 Breaking the rules!',
        '@Nevysian#2014 1d',
        '@Nevysian#2014 1d Breaking the rules!',
    ],
    arguments: true,
    permissions: ['BAN_MEMBERS'],
    execute(bot, msg, args, functions, db) {
        const member = msg.guild.members.cache.get(args[0]) || msg.mentions.members.first() || { id: args[0].replace(/\D/g, '') };
        const duration = ms(args[1] || '0') || 0;
        if(duration) args.splice(1, 1);
        const reason = args.slice(1).join(' ') || 'No reason given';
        if(!member.id) return functions.send_embed(msg, 'You didn\'t specify a valid member.');
        if(msg.guild.members.cache.has(member.id)) {
            if(member.roles.highest.position >= msg.member.roles.highest.position || member.id == msg.author.id) return functions.send_embed(msg, 'You don\'t have permissions to ban that member.');
            if(!member.bannable) return functions.send_embed(msg, 'I don\'t have permissions to ban that member.');
        }
        if(duration >= ms('3w')) return functions.send_embed(msg, 'The duration must be below `3 weeks`.');
        if(reason.length > 512) return functions.send_embed(msg, 'The reason can\'t be longer than `512` characters.');
        msg.guild.fetchBans().then(async bans => {
            if(bans.has(member.id)) return functions.send_embed(msg, 'That user has already been banned.');
            if(msg.guild.members.cache.has(member.id)) await functions.send_embed(member, `You have been banned from \`${msg.guild.name}\` | ${reason}`);
            msg.guild.members.ban(member.id, { reason: reason, days: 1 }).then(banned_user => {
                banned_user = banned_user.user || banned_user;
                if(typeof banned_user == 'string') banned_user = { id: banned_user };
                functions.send_embed(msg, `\`${banned_user.tag || banned_user.id}\` has been banned | ${reason}`);
                const command_log = new MessageEmbed()
                .setDescription(`A member has been banned by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Victim', `<@!${banned_user.id}> | ${banned_user.id}`, true)
                .addField('Duration', duration ? ms(duration, { long: true }) : 'No duration.', true)
                .addField('Reason', reason, true);
                functions.log_command(this.name, command_log, msg, { guild_id: msg.guild.id, member_id: member.id, log_by: msg.author.id, reason: reason, duration: duration });
                if(!duration) return;
                function handle_timeout() {
                    db.query(`DELETE FROM bans WHERE guild_id = '${msg.guild.id}' AND member_id = '${member.id}'`, err => {
                        if(err) return functions.log_error(err);
                        msg.guild.members.unban(member.id, 'Time ran out').catch(() => true);
                    });
                }
                db.query(`SELECT * FROM bans WHERE guild_id = '${msg.guild.id}' AND member_id = '${member.id}'`, (err, db_bans) => {
                    if(err) return functions.log_error(err);
                    let sql;
                    if(!db_bans.length) sql = `INSERT INTO bans (guild_id, member_id, reason, created_at, duration) VALUES('${msg.guild.id}', '${member.id}', ${db.escape(reason)}, ${Date.now()}, ${duration})`;
                    else sql = `UPDATE bans SET reason = ${db.escape(reason)}, created_at = ${Date.now()}, duration = ${duration} WHERE id = ${db_bans[0].id}`;
                    db.query(sql, err => {
                        if(err) return functions.log_error(err);
                        setTimeout(handle_timeout, duration);
                    });
                });
            }, e => {
                if(e.code == 10013) return functions.send_embed(msg, 'You didn\'t specify a valid user.');
                functions.send_embed(msg, `There was a problem while banning that user | Error: \`${e.message}\``);
            });
        }, e => {
            functions.send_embed(msg, `There was a problem while fetching the bans | Error: \`${e.message}\``);
        });
    },
};