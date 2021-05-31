const { MessageEmbed } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'verify',
    description: 'Verifies you or the specified member.',
    usage: '(member)',
    examples: [
        '@Nevysian#2014',
    ],
    cooldown: '5s',
    bot_permissions: ['MANAGE_ROLES'],
    execute(bot, msg, args, functions, db) {
        db.query(`SELECT * FROM guild_settings WHERE guild_id = '${msg.guild.id}'`, (err, guilds) => {
            if(err) return functions.log_error(err);
            if(!guilds.length || !guilds[0].verification) return functions.send_embed(msg, 'Verification isn\'t enabled for this server.');
            const role = msg.guild.roles.cache.get(guilds[0].verified_role);
            const member = msg.guild.members.cache.get(args[0]) || msg.mentions.members.first() || msg.member;
            if(!role) return functions.send_embed(msg, 'The verified role doesn\'t exist.');
            if(role.permissions.has('ADMINISTRATOR')) return functions.send_embed(msg, 'Roles with the `ADMINISTRATOR` permission can\'t be set as the verified role.');
            if(!role.editable) return functions.send_embed(msg, 'I don\'t have permissions to make changes to the verified role.');
            if(member.id == msg.author.id) {
                if(member.roles.cache.has(role.id)) return functions.send_embed(msg, 'You have already been verified!');
                if(Date.now() - msg.author.createdTimestamp < ms('1w')) return functions.send_embed(msg, 'Your account is too new, please DM someone that can verify you to get verified. This is to prevent alts.');
                let token = [];
                for(let index = 0; index < 4; index++) {
                    token.push(Math.random().toString(36).substring(2, 10));
                }
                token = token.join('-');
                db.query(`INSERT INTO verification(guild_id, member_id, token) VALUES('${msg.guild.id}', '${member.id}', '${token}')`, (err, res) => {
                    if(err) return functions.log_error(err);
                    functions.send_embed(member, `Verify yourself by entering this link: http://test-domain.com/verification?token=${token}`).then(() => {
                        functions.send_embed(msg, 'I have sent you the verification, check your dms!');
                        setTimeout(() => {
                            db.query(`DELETE FROM verification WHERE id = ${res.insertId}`);
                        }, ms('1h'));
                    }, e => {
                        functions.send_embed(msg, `There was a problem while DMing you the verification | Error: \`${e.message}\``, { header: member });
                        db.query(`DELETE FROM verification WHERE id = ${res.insertId}`);
                    });
                });
                return;
            }
            if(!msg.member.permissions.has('MANAGE_ROLES')) return functions.send_embed(msg, 'You must have the `MANAGE_ROLES` permission to use this command.');
            if(member.roles.cache.has(role.id)) return functions.send_embed(msg, `${member} has already been verified.`);
            member.roles.add(role).then(() => {
                db.query(`DELETE FROM verification WHERE guild_id = '${msg.guild.id}' AND member_id = '${member.id}'`);
                functions.send_embed(member, `You have been verified in \`${msg.guild.name}\`!`);
                functions.send_embed(msg, `${member} has been verified.`);
                const command_log = new MessageEmbed()
                .setDescription(`A member has been verified by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Victim', member, true);
                functions.log_command(this.name, command_log, msg, { guild_id: msg.guild.id, member_id: member.id, log_by: msg.author.id });
            }, e => {
                functions.send_embed(msg, `There was a problem while giving that member the verified role | Error: \`${e.message}\``);
            });
        });
    },
};