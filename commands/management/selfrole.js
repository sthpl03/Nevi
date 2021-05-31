const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'selfrole',
    description: 'Adds or deletes the self-assignable property from a role, self-assignable roles can be obtained by anyone by executing this command without a type.',
    fields: [
        {
            name: 'Types',
            value: [
                '`add` - Sets a role as self-assignable',
                '`delete` - Sets a role as not self-assignable',
                '`list` - Lists all the self-assignable roles',
            ].join('\n'),
        },
    ],
    usage: '(type) (role | page)',
    examples: [
        'list',
        'Announcements',
        'add Announcements',
    ],
    cooldown: '5s',
    arguments: true,
    execute(bot, msg, args, functions, db) {
        const types = ['add', 'delete', 'list'];
        const type = types.find(t => t == args[0].toLowerCase());
        if(type) args.splice(0, 1);
        if(type == 'list') {
            db.query(`SELECT * FROM self_roles WHERE guild_id = '${msg.guild.id}'`, (err, self_roles) => {
                if(err) return functions.log_error(err);
                if(!self_roles.length) return functions.send_embed(msg, 'There aren\'t any self-assignable roles yet.');
                const page = Number(args[0]) || 1;
                const max_page = Math.ceil(self_roles.length / 25);
                if(page > max_page) return functions.send_embed(msg, 'You didn\'t specify a valid page.');
                const items_amount = 25 * (page - 1);
                const current_page = self_roles.slice(items_amount, items_amount + 25);
                const sa_roles = functions.embed(null, { title: `Self-Assignable Roles [${self_roles.length}]` })
                .setDescription(current_page.map(r => `- <@&${r.role_id}>`))
                .setFooter(`${functions.fix_user(msg.author)} | Page: ${page}/${max_page}`, msg.author.displayAvatarURL({ dynamic: true }));
                msg.channel.send(sa_roles);
            });
            return;
        }
        const role = msg.guild.roles.cache.get(args[0]) || msg.guild.roles.cache.find(r => r.name.toLowerCase().includes(args.join(' ').toLowerCase()));
        if(!role || role.id == msg.guild.roles.everyone.id) return functions.send_embed(msg, 'You didn\'t specify a valid role.');
        if(role.permissions.has('ADMINISTRATOR')) return functions.send_embed(msg, 'Roles with the `ADMINISTRATOR` permission can\'t be set as self-assignable.');
        if(!role.editable) return functions.send_embed(msg, 'I don\'t have permissions to make changes to that role.');
        db.query(`SELECT * FROM self_roles WHERE guild_id = '${msg.guild.id}' AND role_id = '${role.id}'`, (err, self_roles) => {
            if(err) return functions.log_error(err);
            if(type) {
                if(!msg.member.permissions.has('MANAGE_ROLES')) return functions.send_embed(msg, 'You must have the `MANAGE_ROLES` permission to execute this command.');
                if(role.position >= msg.member.roles.highest.position) return functions.send_embed(msg, 'You don\'t have permissions to make changes to that role.');
                let sql;
                if(!self_roles.length) {
                    if(type == 'delete') return functions.send_embed(msg, 'That role is already not self-assignable.');
                    sql = `INSERT INTO self_roles(guild_id, role_id) VALUES('${msg.guild.id}', '${role.id}')`;
                }
                else {
                    if(type == 'add') return functions.send_embed(msg, 'That role is already self-assignable.');
                    sql = `DELETE FROM self_roles WHERE id = ${self_roles[0].id}`;
                }
                db.query(sql, err => {
                    if(err) return functions.log_error(err);
                    if(type == 'add') functions.send_embed(msg, `The ${role} role has been set as self-assignable.`);
                    else functions.send_embed(msg, `The ${role} role has been set as not self-assignable.`);
                    const command_log = new MessageEmbed()
                    .setDescription(`A role has been set as ${type == 'delete' ? 'not' : ''} self-assignable by ${msg.author}`)
                    .addField('Author', msg.author, true)
                    .addField('Role', role, true)
                    .addField('Type', type, true);
                    functions.log_command(this.name, command_log, msg);
                });
            }
            else {
                if(!self_roles.length) return functions.send_embed(msg, 'That role isn\'t self-assignable.');
                if(!msg.member.roles.cache.has(role.id)) {
                    msg.member.roles.add(role, 'Self-Assignable Role').then(() => {
                        functions.send_embed(msg, `You now have the ${role} role!`);
                    }, e => {
                        functions.send_embed(msg, `There was a problem while giving you the ${role} role | Error: \`${e.message}\``);
                    });
                }
                else {
                    msg.member.roles.remove(role, 'Self-Assignable Role').then(() => {
                        functions.send_embed(msg, `You no longer have the ${role} role.`);
                    }, e => {
                        functions.send_embed(msg, `There was a problem while removing the ${role} role from you | Error: \`${e.message}\``);
                    });
                }
            }
        });
    },
};