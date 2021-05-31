const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'welcomemessage',
    aliases: ['setwm', 'wmessage'],
    description: 'Updates, disables or gets the server\'s welcome message settings, every member that joins the server will receive the welcome message.',
    fields: [
        {
            name: 'Types',
            value: [
                '`dm` - Sets the welcome message type to DMs, so every time a member joins they will get DMed with the welcome message.',
                '`channel` - Sets the welcome messsage type to a channel, so every time a member joins the welcome message will be sent in the welcome/leave channel.',
            ].join('\n'),
        },
        {
            name: 'Message Fields',
            value: [
                '`{server}` - The server name.',
                '`{mention}` - The mention of the member.',
                '`{username}` - The username of the member.',
                '`{tag}` - The tag of the member.',
            ].join('\n'),
        },
    ],
    usage: '(message | disable | type)',
    examples: [
        '{mention} Welcome!',
        'disable',
        'dm',
    ],
    cooldown: '10s',
    member_permissions: ['MANAGE_GUILD'],
    execute(bot, msg, args, functions, db) {
        let message = (args[0] || '').toLowerCase() != 'disable' ? args.join(' ') : '';
        const types = ['channel', 'dm'];
        let type = types.indexOf(message);
        if(message.length > 1024) return functions.send_embed(msg, 'The message can\'t be longer than `1,024` characters.');
        db.query(`SELECT * FROM guild_settings WHERE guild_id = '${msg.guild.id}'`, (err, guilds) => {
            let sql;
            if(err) return functions.log_error(err);
            const guild_settings = guilds[0] || {
                welcome_message: '',
                wm_type: 0,
            };
            if(!args.length) {
                const settings = functions.embed(msg.author)
                .setDescription(`${msg.guild.name}'s welcome message settings`)
                .addField('Welcome Message', guild_settings.welcome_message || 'Disabled', true)
                .addField('Type', types[guild_settings.wm_type], true)
                .setThumbnail(msg.guild.iconURL({ dynamic: true }));
                return msg.channel.send(settings);
            }
            if(type < 0) {
                type = guild_settings.wm_type;
                if(message == guild_settings.welcome_message) return functions.send_embed(msg, 'The welcome message has already been set to that.');
                functions.send_embed(msg, `The welcome message has been ${message ? `set to \`${message}\`` : 'disabled.'}`);
            }
            else {
                message = guild_settings.welcome_message;
                if(type == guild_settings.wm_type) return functions.send_embed(msg, 'The welcome message type has already been set to that.');
                functions.send_embed(msg, `The welcome message type has been set to \`${types[type]}\``);
            }
            if(!guilds.length) sql = `INSERT INTO guild_settings (guild_id, wm_type, welcome_message) VALUES('${msg.guild.id}', ${type}, ${db.escape(message)})`;
            else sql = `UPDATE guild_settings SET wm_type = ${type}, welcome_message = ${db.escape(message)} WHERE guild_id = '${msg.guild.id}'`;
            db.query(sql, err => {
                if(err) return functions.log_error(err);
                const command_log = new MessageEmbed()
                .setDescription(`The welcome message settings have been changed by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Welcome Message', message || 'Disabled', true)
                .addField('Type', types[type], true);
                functions.log_command(this.name, command_log, msg);
            });
        });
    },
};