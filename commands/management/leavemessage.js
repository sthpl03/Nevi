const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'leavemessage',
    aliases: ['setlm'],
    description: 'Sets the leave message the bot will send every time a member leaves.',
    fields: [
        {
            name: 'Message Fields',
            value: [
                '`{server}` - The server name.',
                '`{mention}` - The mention of the member.',
                '`{username}` - The username of the member.',
                '`{tag}` - The tag of the member.',
            ],
        },
    ],
    usage: '(message | disable)',
    examples: [
        '{mention} Goodbye!',
        'disable',
    ],
    arguments: true,
    cooldown: '10s',
    member_permissions: ['MANAGE_GUILD'],
    execute(bot, msg, args, functions, db) {
        const message = args[0].toLowerCase() != 'disable' ? args.join(' ') : '';
        if(message.length > 1024) return functions.send_embed(msg, 'The leave message can\'t be longer than `1024` characters.');
        db.query(`SELECT leave_message FROM guild_settings WHERE guild_id = '${msg.guild.id}'`, (err, guilds) => {
            if(err) return functions.log_error(err);
            let sql;
            const guild_settings = guilds[0] || {
                leave_message: '',
            };
            if(message == guild_settings.leave_message) {
                if(!message) return functions.send_embed(msg, 'The leave message has already been disabled.');
                return functions.send_embed(msg, 'The leave message has already been set to that message.');
            }
            if(!guilds.length) sql = `INSERT INTO guild_settings(guild_id, leave_message) VALUES('${msg.guild.id}', ${db.escape(message)})`;
            else sql = `UPDATE guild_settings SET leave_message = ${db.escape(message)} WHERE guild_id = '${msg.guild.id}'`;
            db.query(sql, err => {
                if(err) return functions.log_error(err);
                if(!message) functions.send_embed(msg, 'The leave message has been disabled.');
                else functions.send_embed(msg, `The leave message has been set to \`${message}\``);
                const command_log = new MessageEmbed()
                .setDescription(`The leave message has been changed by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Leave Message', message || 'Disabled', true);
                functions.log_command(this.name, command_log, msg);
            });
        });
    },
};