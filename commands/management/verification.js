const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'verification',
    description: 'Sets up or updates the verification settings for this server.',
    fields: [
        {
            name: 'Types',
            value: [
                '`enable` - Enables verification in this server.',
                '`disable` - Disables verification in this server.',
                '`role` - Sets the verified role.',
                '`channel` - Sets the verification channel.',
                '`settings` - Gets the server\'s current verification settings.',
            ].join('\n'),
        },
    ],
    usage: '(type) (value)',
    examples: [
        'enable',
        'disable',
        'role Member',
        'channel #verification',
        'settings',
    ],
    arguments: true,
    cooldown: '5s',
    member_permissions: ['MANAGE_GUILD'],
    execute(bot, msg, args, functions, db) {
        const types = ['disable', 'enable', 'role', 'channel', 'settings'];
        let type = types.find(t => t == args[0].toLowerCase());
        if(type) args.splice(0, 1);
        else return functions.send_embed(msg, 'You didn\'t specify a valid type.');
        db.query(`SELECT * FROM guild_settings WHERE guild_id = '${msg.guild.id}'`, (err, guilds) => {
            if(err) return functions.log_error(err);
            let sql;
            const guild_settings = guilds[0] || {
                verification: 0,
                verification_channel: '',
                verified_role: '',
            };
            if(type == 'settings') {
                const role = msg.guild.roles.cache.get(guild_settings.verified_role);
                const channel = msg.guild.channels.cache.get(guild_settings.verification_channel);
                const settings = functions.embed(msg.author)
                .setDescription(`${msg.guild.name}'s verification settings`)
                .setThumbnail(msg.guild.iconURL({ dynamic: true }))
                .addField('Enabled', guild_settings.verification ? 'Yes' : 'No', true)
                .addField('Channel', channel || 'Not set yet', true)
                .addField('Role', role || 'Not set yet', true);
                return msg.channel.send(settings);
            }
            if(type == 'role') {
                const role = msg.guild.roles.cache.get(args[0]) || msg.guild.roles.cache.find(r => r.name.toLowerCase().includes(args.join(' ').toLowerCase()));
                if(!role || role.id == msg.guild.roles.everyone.id) return functions.send_embed(msg, 'You didn\'t specify a valid role.');
                if(role.id == guild_settings.verified_role) return functions.send_embed(msg, 'That role has already been set as the verified role.');
                if(role.position >= msg.member.roles.highest.position) return functions.send_embed(msg, 'You don\'t have permissions to make changes to that role.');
                if(role.permissions.has('ADMINISTRATOR')) return functions.send_embed(msg, 'Roles with the `ADMINISTRATOR` permission can\'t be set as the verified role.');
                if(!role.editable) return functions.send_embed(msg, 'I don\'t have permissions to make changes to that role.');
                functions.send_embed(msg, `The verified role has been set to ${role}.`);
                guild_settings.verified_role = role.id;
            }
            else if(type == 'channel') {
                const channel = msg.guild.channels.cache.get(args[0]) || msg.mentions.channels.first();
                if(!channel) return functions.send_embed(msg, 'You didn\'t specify a valid channel.');
                if(channel.id == guild_settings.verification_channel) return functions.send_embed(msg, 'That channel has already been set as the verification channel.');
                if(!channel.viewable) return functions.send_embed(msg, 'I don\'t have permissions to view that channel.');
                if(!channel.permissionsFor(bot.user).has('SEND_MESSAGES')) return functions.send_embed(msg, 'I must have the `SEND_MESSAGES` permission in that channel.');
                if(!channel.permissionsFor(bot.user).has('EMBED_LINKS')) return functions.send_embed(msg, 'I must have the `EMBED_LINKS` permission in that channel.');
                functions.send_embed(msg, `The verification channel has been set to ${channel}.`);
                guild_settings.verification_channel = channel.id;
            }
            else if(guild_settings.verification) {
                if(type == 'enable') return functions.send_embed(msg, 'Verification has already been enabled for this server.');
                type = 'Disable';
                guild_settings.verification = 0;
                functions.send_embed(msg, 'Verification has been disabled.');
            }
            else {
                if(type == 'disable') return functions.send_embed(msg, 'Verification has already been disabled for this server.');
                type = 'Enable';
                guild_settings.verification = 1;
                functions.send_embed(msg, 'Verification has been enabled.');
            }
            if(!guilds.length) sql = `INSERT INTO guild_settings(guild_id, verification, verification_channel, verified_role) VALUES('${msg.guild.id}', ${guild_settings.verification}, '${guild_settings.verification_channel}', '${guild_settings.verified_role}')`;
            else sql = `UPDATE guild_settings SET verification = ${guild_settings.verification}, verification_channel = '${guild_settings.verification_channel}', verified_role = '${guild_settings.verified_role}'  WHERE guild_id = '${msg.guild.id}'`;
            db.query(sql, err => {
                if(err) return functions.log_error(err);
                const command_log = new MessageEmbed()
                .setDescription(`The verification settings have been updated by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Type', type, true);
                functions.log_command(this.name, command_log, msg);
            });
        });
    },
};