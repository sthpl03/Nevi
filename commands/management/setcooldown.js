const { MessageEmbed } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'setcooldown',
    description: 'Changes the specified command\'s cooldown to the one given.',
    usage: '(command) (cooldown)',
    examples: [
        'mute 30s',
    ],
    arguments: true,
    cooldown: '10s',
    member_permissions: ['MANAGE_GUILD'],
    execute(bot, msg, args, functions, db) {
        const command = bot.commands.get(bot.aliases.get(args[0].toLowerCase()) || args[0].toLowerCase());
        const cooldown = ms(args[1] || '0') || 0;
        if(!command) return functions.send_embed(msg, 'You didn\'t specify a valid command.');
        if(!cooldown) return functions.send_embed(msg, 'You didn\'t specify a valid cooldown.');
        const default_cooldown = ms(command.cooldown || '3s');
        if(cooldown < default_cooldown) return functions.send_embed(msg, 'The cooldown can\'t be less than the command\'s default cooldown.');
        db.query(`SELECT * FROM commands WHERE guild_id = '${msg.guild.id}' AND command = '${command.name}'`, (err, commands) => {
            if(err) return functions.log_error(err);
            let sql;
            const command_settings = commands[0] || {
                cooldown: 0,
            };
            if(cooldown == (command_settings.cooldown || default_cooldown)) return functions.send_embed(msg, 'That command\'s cooldown has already been set to that.');
            if(!commands.length) sql = `INSERT INTO commands (guild_id, command, cooldown) VALUES('${msg.guild.id}', '${command.name}', ${cooldown})`;
            else sql = `UPDATE commands SET cooldown = ${cooldown} WHERE id = ${command_settings.id}`;
            db.query(sql, err => {
                if(err) return functions.log_error(err);
                functions.send_embed(msg, `\`${command.name}\`'s cooldown has been set to \`${ms(cooldown, { long: true })}\``);
                const command_log = new MessageEmbed()
                .setDescription(`A command's cooldown has been changed by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Command', command.name, true)
                .addField('Cooldown', ms(cooldown, { long: true }), true);
                functions.log_command(this.name, command_log, msg);
            });
        });
    },
};