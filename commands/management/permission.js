const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'permission',
    description: 'Gives or removes the bot permission given from the specified role.',
    fields: [
        {
            name: 'Permissions',
            value: [
                '`command` - A command.',
                '`category` - A category.',
                '`all` - All the commands and categories.',
            ].join('\n'),
        },
        {
            name: 'Types',
            value: [
                '`give` - Gives the permission to the member.',
                '`remove` - Removes the permission from the member.',
                '`adapt` - Adapts the permission of the member to the command\'s permissions.',
            ].join('\n'),
        },
    ],
    usage: '(permission | show) (type) (role)',
    examples: [
        'show Moderator',
        'mute Moderator',
        'mute give Moderator',
    ],
    member_permissions: ['ADMINISTRATOR'],
    arguments: true,
    cooldown: '10s',
    execute(bot, msg, args, functions, db) {
        const categories = ['management', 'moderation'];
        const command = bot.commands.get(args[0].toLowerCase());
        const other = ['all', 'show'];
        const permission = categories.find(c => c == args[0].toLowerCase()) || (command ? command.name : null) || other.find(v => v == args[0].toLowerCase());
        const types = ['give', 'remove', 'adapt'];
        let type = types.find(t => t == (args[1] || '').toLowerCase());
        if(type) args.splice(1, 1);
        const role = msg.guild.roles.cache.get(args[1]) || msg.guild.roles.cache.find(r => r.name.toLowerCase().includes(args.slice(1).join(' ').toLowerCase()));
        const get_command_permissions = c => (c.member_permissions || []).concat(c.permissions || []);
        const permissions_needed = permission == 'all' ? ['ADMINISTRATOR'] : (command ? get_command_permissions(command) : []);
        if(!permission) return functions.send_embed(msg, 'You didn\'t specify a valid permission.');
        if(!role || role.id == msg.guild.roles.everyone.id) return functions.send_embed(msg, 'You didn\'t specify a valid role.');
        if(role.position >= msg.member.roles.highest.position) return functions.send_embed(msg, 'You don\'t have permissions to make changes to that role.');
        if(!role.editable) return functions.send_embed(msg, 'I don\'t have permissions to make changes to that role.');
        if(permission == 'show') {
            db.query(`SELECT * FROM permissions WHERE guild_id = '${msg.guild.id}' AND role_id = '${role.id}'`, (err, permissions) => {
                if(err) return functions.log_error(err);
                const bot_permissions = permissions.filter(p => !p.disabled).map(p => `\`${p.permission}\``);
                const adapted_permissions = bot.commands.filter(c => get_command_permissions(c).length && get_command_permissions(c).every(p => role.permissions.has(p)) && !permissions.some(p => c.name == p.permission)).map(c => `\`${c.name}\``);
                const permissions_embed = functions.embed(msg.author)
                .setDescription(`${role}'s permissions [${bot_permissions.length + adapted_permissions.length}]`)
                .addField(`Bot Permissions [${bot_permissions.length}]`, bot_permissions.join(', ') || 'This role doesn\'t have any bot permission.')
                .addField(`Adapted Permissions [${adapted_permissions.length}]`, adapted_permissions.join(', ') || 'This role doesn\'t have any adapted permission.');
                msg.channel.send(permissions_embed);
            });
            return;
        }
        db.query(`SELECT * FROM permissions WHERE guild_id = '${msg.guild.id}' AND role_id = '${role.id}' AND (permission = 'all' OR permission = '${permission}')`, (err, permissions) => {
            if(err) return functions.log_error(err);
            let sql;
            const permission_found = permissions[0] || {
                permission: '',
                disabled: 1,
            };
            if(permission_found.permission == 'all' && permission != 'all' || role.permissions.has('ADMINISTRATOR')) return functions.send_embed(msg, `The ${role} role already has all the permissions.`);
            if(permissions_needed.length && !permissions.length && permissions_needed.every(p => role.permissions.has(p))) permission_found.disabled = 0;
            if(type != 'adapt') {
                if(permission_found.disabled) {
                    if(type == 'remove') return functions.send_embed(msg, 'That permission has already been removed from that role.');
                    permission_found.disabled = 0;
                    type = 'Give';
                }
                else {
                    if(type == 'give') return functions.send_embed(msg, 'That permission has already been given to that role.');
                    permission_found.disabled = 1;
                    type = 'Remove';
                }
            }
            else if(!permissions.length) return functions.send_embed(msg, 'That permissions already adapts to that role.');
            if(!permissions.length) sql = `INSERT INTO permissions (guild_id, role_id, permission, disabled) VALUES('${msg.guild.id}', '${role.id}', '${permission}', ${permission_found.disabled})`;
            else sql = `UPDATE permissions SET disabled = ${permission_found.disabled} WHERE id = ${permission_found.id}`;
            if(permission == 'all' && permission_found.disabled || type == 'adapt') sql = `DELETE FROM permissions WHERE id = ${permission_found.id}`;
            functions.confirmation(msg, () => {
                db.query(sql, err => {
                    if(err) return functions.log_error(err);
                    if(type == 'adapt') {
                        functions.send_embed(msg, `The \`${permission}\` permission has been adapted to the ${role} role.`);
                        type = 'Adapt';
                    }
                    else if(permission_found.disabled) functions.send_embed(msg, `The \`${permission}\` permission has been removed from the ${role} role.`);
                    else functions.send_embed(msg, `The \`${permission}\` permission has been given to the ${role} role.`);
                    const command_log = new MessageEmbed()
                    .setDescription(`A role got their permissions changed by ${msg.author}`)
                    .addField('Author', msg.author, true)
                    .addField('Permission', permission, true)
                    .addField('Type', type, true)
                    .addField('Role', role, true);
                    functions.log_command(this.name, command_log, msg);
                });
            });
        });
    },
};