const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'defaultrole',
    description: 'Sets or disables the role every new member will get when they join the server.',
    usage: '(role | disable)',
    examples: [
        'Member',
        'disable',
    ],
    permissions: ['MANAGE_ROLES'],
    member_permissions: ['MANAGE_GUILD'],
    cooldown: '10s',
    arguments: true,
    execute(bot, msg, args, functions, db) {
        const role = msg.guild.roles.cache.get(args[0]) || msg.guild.roles.cache.find(r => r.name.toLowerCase().includes(args.join(' ').toLowerCase())) || (args[0].toLowerCase() == 'disable' ? { id: '' } : null);
        if(!role || role.id == msg.guild.roles.everyone.id) return functions.send_embed(msg, 'You didn\'t specify a valid role.');
        if(role.id) {
            if(role.position >= msg.member.roles.highest.position) return functions.send_embed(msg, 'You don\'t have permissions to make changes to that role.');
            if(role.permissions.has('ADMINISTRATOR')) return functions.send_embed(msg, 'Roles with the `ADMINISTRATOR` permission can\'t be set as the default role.');
            if(!role.editable) return functions.send_embed(msg, 'I don\'t have permissions to make changes to that role.');
        }
        db.query(`SELECT default_role FROM guild_settings WHERE guild_id = '${msg.guild.id}'`, (err, guilds) => {
            if(err) return functions.log_error(err);
            let sql;
            const guild_settings = guilds[0] || {
                default_role: '',
            };
            if(role.id == guild_settings.default_role) {
                if(!role.id) return functions.send_embed(msg, 'The default role has already been disabled.');
                return functions.send_embed(msg, 'The default role has already been set to that role.');
            }
            if(!guilds.length) sql = `INSERT INTO guild_settings(guild_id, default_role) VALUES('${msg.guild.id}', '${role.id}')`;
            else sql = `UPDATE guild_settings SET default_role = '${role.id}' WHERE guild_id = '${msg.guild.id}'`;
            db.query(sql, err => {
                if(err) return functions.log_error(err);
                if(!role.id) functions.send_embed(msg, 'The default role has been disabled.');
                else functions.send_embed(msg, `The default role has been set to ${role}.`);
                const command_log = new MessageEmbed()
                .setDescription(`The default role has been changed by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Role', role.id ? role : 'Disabled', true);
                functions.log_command(this.name, command_log, msg);
            });
        });
    },
};