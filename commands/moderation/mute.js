const { MessageEmbed } = require('discord.js');
const { max_reason_length } = require('../../config.json');
const ms = require('ms');

module.exports = {
    name: 'mute',
    description: 'Mutes the specified member forever or for the duration specified for the reason given.',
    usage: '(member) (duration) (reason)',
    examples: [
        '@Nevysian#2014',
        '@Nevysian#2014 Breaking rule #1.',
        '@Nevysian#2014 1d',
        '@Nevysian#2014 1d Breaking rule #1.',
    ],
    arguments: true,
    permissions: ['MANAGE_ROLES'],
    execute(bot, msg, args, functions, db) {
        const member = msg.guild.members.cache.get(args[0]) || msg.mentions.members.first();
        const duration = ms(args[1] || '0') || 0;
        if(duration) args.splice(1, 1);
        const reason = args.slice(1).join(' ') || 'No reason given.';
        if(!member || member.id == msg.author.id) return functions.send_embed(msg, 'You didn\'t specify a valid member.');
        if(duration < 0 || duration >= ms('3w')) return functions.send_embed(msg, 'You didn\'t specify a valid mute duration.');
        if(reason.length > max_reason_length) return functions.send_embed(msg, `The reason can't be longer than \`${max_reason_length}\` characters.`);
        db.query(`SELECT muted_role FROM guild_settings WHERE guild_id = '${msg.guild.id}'`, async (err, guilds) => {
            if(err) return functions.log_error(err);
            let sql;
            const guild_settings = guilds[0] || {
                muted_role: '',
            };
            let muted_role = msg.guild.roles.cache.get(guild_settings.muted_role) || msg.guild.roles.cache.find(r => r.name.toLowerCase() == 'muted');
            if(!muted_role) {
                await msg.guild.roles.create({ data: {
                    name: 'Muted',
                    permissions: [],
                }, reason: 'Muted role didn\'t exist' }).then(created_role => {
                    muted_role = created_role;
                    msg.guild.channels.cache.forEach(channel => {
                        channel.updateOverwrite(muted_role, {
                            CONNECT: false,
                            SEND_MESSAGES: false,
                            ADD_REACTIONS: false,
                        }, 'Muted role didn\'t exist').catch(() => true);
                    });
                }, e => {
                    functions.send_embed(msg, `There was a problem while creating the muted role | Error: \`${e.message}\``);
                });
                if(!muted_role) return;
            }
            function handle_success(err) {
                if(err) return functions.log_error(err);
                functions.send_embed(member, `You have been muted in \`${msg.guild.name}\` | ${reason}`);
                functions.send_embed(msg, `${member} has been muted | ${reason}`);
                const command_log = new MessageEmbed()
                .setDescription(`A member has been muted by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Victim', member, true)
                .addField('Reason', reason, true)
                .addField('Duration', duration ? ms(duration, { long: true }) : 'Permanent', true);
                functions.log_command(exports.name, command_log, msg, { guild_id: msg.guild.id, member_id: member.id, log_by: msg.author.id, reason: reason, duration: duration });
                if(!duration) return;
                setTimeout(() => {
                    db.query(`DELETE FROM roles WHERE guild_id = '${msg.guild.id}' AND member_id = '${member.id}' AND role_id = '${muted_role.id}'`, err => {
                        if(err) return functions.log_error(err);
                        member.roles.remove(muted_role, 'Time ran out');
                    });
                }, duration);
            }
            if(!guilds.length) sql = `INSERT INTO guild_settings (guild_id, muted_role) VALUES('${msg.guild.id}', '${muted_role.id}')`;
            else sql = `UPDATE guild_settings SET muted_role = '${muted_role.id}' WHERE guild_id = '${msg.guild.id}'`;
            db.query(sql, err => {
                if(err) return functions.log_error(err);
                if(member.roles.cache.has(muted_role.id)) return functions.send_embed(msg, 'That member has already been muted.');
                if(!muted_role.editable) return functions.send_embed(msg, 'I don\'t have permissions to make changes to the muted role.');
                member.roles.add(muted_role, reason).then(() => {
                    db.query(`SELECT * FROM roles WHERE guild_id = '${msg.guild.id}' AND member_id = '${member.id}' AND role_id = '${muted_role.id}'`, (err, roles) => {
                        if(err) return functions.log_error(err);
                        if(!roles.length) sql = `INSERT INTO roles (guild_id, member_id, role_id, reason, created_at, duration) VALUES('${msg.guild.id}', '${member.id}', '${muted_role.id}', ${db.escape(reason)}, ${Date.now()}, ${duration})`;
                        else sql = `UPDATE roles SET reason = ${db.escape(reason)}, created_at = ${Date.now()}, duration = ${duration} WHERE id = ${roles[0].id}`;
                        db.query(sql, handle_success);
                    });
                }, e => {
                    functions.send_embed(msg, `There was a problem while giving that member the muted role | Error: \`${e.message}\``);
                });
            });
        });
    },
};