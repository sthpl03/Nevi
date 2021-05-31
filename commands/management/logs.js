const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'logs',
    description: 'Sets the logs of the type given to the specified channel.',
    fields: [{
        name: 'Logs Categories',
        value: [
            '`messages` - Logs all the deleted and edited messages.',
            '`moderation` - Logs all the moderation commands.',
            '`management` - Logs all the management commands.',
        ].join('\n'),
    }],
    usage: '(logs category) (channel | disable)',
    examples: [
        'messages #general',
        'messages disable',
    ],
    arguments: true,
    cooldown: '10s',
    member_permissions: ['MANAGE_CHANNELS'],
    execute(bot, msg, args, functions, db) {
        const categories = ['messages', 'moderation', 'management'];
        const category = categories.find(c => c == args[0].toLowerCase());
        const channel = msg.guild.channels.cache.get(args[1]) || msg.mentions.channels.first() || ((args[1] || '').toLowerCase() == 'disable' ? { id: '' } : null);
        if(!category) return functions.send_embed(msg, 'You didn\'t specify a valid log category.');
        if(!channel) return functions.send_embed(msg, 'You didn\'t specify a valid channel.');
        if(channel.id) {
            if(!channel.viewable) return functions.send_embed(msg, 'I must have permissions to view that channel.');
            if(!channel.permissionsFor(bot.user).has('SEND_MESSAGES')) return functions.send_embed(msg, 'I must have the `SEND_MESSAGES` permission on that channel.');
            if(!channel.permissionsFor(bot.user).has('EMBED_LINKS')) return functions.send_embed(msg, 'I must have the `EMBED_LINKS` permission on that channel.');
        }
        db.query(`SELECT * FROM guild_settings WHERE guild_id = '${msg.guild.id}'`, (err, guilds) => {
            if(err) functions.log_error(err);
            let sql;
            const guild_settings = guilds[0] || {
                messages_logs_channel: '',
                moderation_logs_channel: '',
                management_logs_channel: '',
            };
            const field_name = `${category}_logs_channel`;
            if(channel.id == guild_settings[field_name]) {
                if(!channel.id) return functions.send_embed(msg, `The ${category} logs channel has already been disabled.`);
                return functions.send_embed(msg, `The ${category} logs channel has already been set to that channel.`);
            }
            if(!guilds.length) sql = `INSERT INTO guild_settings(guild_id, ${field_name}) VALUES('${msg.guild.id}', '${channel.id}')`;
            else sql = `UPDATE guild_settings SET ${field_name} = '${channel.id}' WHERE guild_id = '${msg.guild.id}'`;
            db.query(sql, err => {
                if(err) return functions.log_error(err);
                if(!channel.id) return functions.send_embed(msg, `The ${category} logs channel has been disabled`);
                else functions.send_embed(msg, `The ${category} logs channel has been set to ${channel}.`);
                const command_log = new MessageEmbed()
                .setDescription(`The ${category} logs channel has been changed by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Logs Category', category, true)
                .addField('Channel', channel.id ? channel : 'Disabled', true);
                functions.log_command(this.name, command_log, msg);
            });
        });
    },
};