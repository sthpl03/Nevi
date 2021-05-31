const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'welcomeleavechannel',
    aliases: ['wlchannel'],
    description: 'Sets the channel where the bot will send the welcome or leave message.',
    usage: '(channel | disable)',
    examples: [
        '#👋welcome-leave',
        'disable',
    ],
    arguments: true,
    cooldown: '10s',
    member_permissions: ['MANAGE_GUILD'],
    execute(bot, msg, args, functions, db) {
        const channel = msg.guild.channels.cache.get(args[0]) || msg.mentions.channels.first() || (args[0].toLowerCase() == 'disable' ? { id: '' } : null);
        if(!channel) return functions.send_embed(msg, 'You didn\'t specify a valid channel.');
        if(channel.id) {
            if(!channel.viewable) return functions.send_embed(msg, 'I don\'t have permissions to view that channel.');
            if(!channel.permissionsFor(bot.user).has('SEND_MESSAGES')) return functions.send_embed(msg, 'I must have the `SEND_MESSAGES` permission in that channel.');
            if(!channel.permissionsFor(bot.user).has('EMBED_LINKS')) return functions.send_embed(msg, 'I must have the `EMBED_LINKS` permission in that channel.');
        }
        db.query(`SELECT wl_channel FROM guild_settings WHERE guild_id = '${msg.guild.id}'`, (err, guilds) => {
            if(err) return functions.log_error(err);
            let sql;
            const guild_settings = guilds[0] || {
                wl_channel: '',
            };
            if(channel.id == guild_settings.wl_channel) {
                if(!channel.id) return functions.send_embed(msg, 'The welcome-leave channel has already been disabled.');
                return functions.send_embed(msg, 'The welcome-leave channel has already been set to that channel.');
            }
            if(!guilds.length) sql = `INSERT INTO guild_settings (guild_id, wl_channel) VALUES('${msg.guild.id}', '${channel.id}')`;
            else sql = `UPDATE guild_settings SET wl_channel = '${channel.id}' WHERE guild_id = '${msg.guild.id}'`;
            db.query(sql, err => {
                if(err) return functions.log_error(err);
                if(!channel.id) functions.send_embed(msg, 'The welcome-leave channel has been disabled.');
                else functions.send_embed(msg, `The welcome-leave channel has been set to ${channel}.`);
                const command_log = new MessageEmbed()
                .setDescription(`The welcome-leave channel has been changed by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Channel', channel.id ? channel : 'Disabled', true);
                functions.log_command(this.name, command_log, msg);
            });
        });
    },
};