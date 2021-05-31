const { MessageEmbed } = require('discord.js');
const Config = require('../../config.json');
const fetch = require('node-fetch');
const ms = require('ms');

module.exports = {
    name: 'kickpersist',
    description: 'Kicks the specified member for the duration and reason given even if the member rejoins the guild.',
    usage: '(member) (duration) (reason)',
    examples: [
        '@Nevysian#2014',
        '@Nevysian#2014 Breaking the rules!',
        '@Nevysian#2014 1d',
        '@Nevysian#2014 1d Breaking the rules!',
    ],
    arguments: true,
    bot_permissions: ['KICK_MEMBERS'],
    member_permissions: ['BAN_MEMBERS'],
    async execute(bot, msg, args, functions, db) {
        const member = msg.guild.members.cache.get(args[0]) || msg.mentions.members.first() || { id: args[0].replace(/\D/g, '') };
        const duration = ms(args[1] || '0') || 0;
        if(duration) args.splice(1, 1);
        const reason = args.slice(1).join(' ') || 'No reason given.';
        const discord_api = await fetch(`https://discord.com/api/v8/users/${member.id}`, { headers: { 'Authorization': `Bot ${Config.token}` } }).then(res => res.json());
        if(!member.id || discord_api.code == 10013) return functions.send_embed(msg, 'You didn\'t specify a valid member.');
        if(msg.guild.members.cache.has(member.id)) {
            if(member.roles.highest.position >= msg.member.roles.highest.position || member.id == msg.author.id) return functions.send_embed(msg, 'You don\'t have permissions to kick persist that member.');
            if(!member.kickable) return functions.send_embed(msg, 'I don\'t have permissions to kick persist that member.');
        }
        if(duration >= ms('3w')) return functions.send_embed(msg, 'You didn\'t specify a valid duration.');
        if(reason.length > Config.max_reason_length) return functions.send_embed(msg, `The reason can't be longer than \`${Config.max_reason_length}\` characters.`);
        db.query(`SELECT * FROM kicks WHERE guild_id = '${msg.guild.id}' AND member_id = '${member.id}'`, async (err, kicks) => {
            if(err) return functions.log_error(err);
            if(kicks.length) return functions.send_embed(msg, 'That user has already been kick persisted.');
            if(msg.guild.members.cache.has(member.id)) {
                await functions.send_embed(member, `You have been kick persisted from \`${msg.guild.name}\` | ${reason}`);
                member.kick(reason).catch(e => {
                    functions.send_embed(msg, `There was a problem while kicking that member | Error: \`${e.message}\``);
                });
            }
            db.query(`INSERT INTO kicks (guild_id, member_id, reason, created_at, duration) VALUES('${msg.guild.id}', '${member.id}', ${db.escape(reason)}, ${Date.now()}, ${duration})`, (err, kick) => {
                if(err) return functions.log_error(err);
                functions.send_embed(msg, `\`${(member.user || '').tag || member.id}\` has been kick persisted | ${reason}`);
                const command_log = new MessageEmbed()
                .setDescription(`A member has been kick persisted by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Victim', `${(member.user || '').tag || `<@!${member.id}>`} | ${member.id}`, true)
                .addField('Reason', reason, true)
                .addField('Duration', duration ? ms(duration, { long: true }) : 'Permanent', true);
                functions.log_command(this.name, command_log, msg, { guild_id: msg.guild.id, member_id: member.id, log_by: msg.author.id, reason: reason, duration: duration });
                if(!duration) return;
                setTimeout(() => {
                    db.query(`DELETE FROM kicks WHERE id = ${kick.insertId}`);
                }, duration);
            });
        });
    },
};