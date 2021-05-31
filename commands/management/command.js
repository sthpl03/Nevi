const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'command',
    description: 'Enables or disables the specified command.',
    fields: [
        {
            name: 'Types',
            value: [
                '`enable` - Enables the command.',
                '`disable` - Disables the command.',
            ].join('\n'),
        },
    ],
    usage: ' (type) (command)',
    examples: [
        'disable meme',
        'meme',
    ],
    arguments: true,
    cooldown: '10s',
    member_permissions: ['MANAGE_GUILD'],
    execute(bot, msg, args, functions, db) {
        const types = ['enable', 'disable'];
        let type = types.find(t => t == args[0].toLowerCase());
        if(type) args.splice(0, 1);
        const whitelisted_commands = ['ping', 'command', 'category', 'botinfo', 'help'];
        const command = bot.commands.get(bot.aliases.get(args[0].toLowerCase()) || args[0].toLowerCase());
        if(!command) return functions.send_embed(msg, 'You didn\'t specify a valid command.');
        if(whitelisted_commands.some(c => command.name == c)) return functions.send_embed(msg, 'That command can\'t be disabled.');
        db.query(`SELECT * FROM commands WHERE guild_id = '${msg.guild.id}' AND command = '${command.name}'`, (err, commands) => {
            if(err) return functions.log_error(err);
            let sql;
            const command_settings = commands[0] || {
                disabled: 0,
            };
            if(!command_settings.disabled) {
                if(type == 'enable') return functions.send_embed(msg, 'That command has already been enabled.');
                type = 'Disable';
                command_settings.disabled = 1;
            }
            else {
                if(type == 'disable') return functions.send_embed(msg, 'That command has already been disabled.');
                type = 'Enable';
                command_settings.disabled = 0;
            }
            if(!commands.length) sql = `INSERT INTO commands (guild_id, command, disabled) VALUES('${msg.guild.id}', '${command.name}', ${command_settings.disabled})`;
            else sql = `UPDATE commands SET disabled = ${command_settings.disabled} WHERE id = ${command_settings.id}`;
            db.query(sql, err => {
                if(err) return functions.log_error(err);
                functions.send_embed(msg, `The \`${command.name}\` command has been ${type.toLowerCase()}d.`);
                const command_log = new MessageEmbed()
                .setDescription(`A command has been ${type.toLowerCase()}d by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Type', type, true)
                .addField('Command', command.name, true);
                functions.log_command(this.name, command_log, msg);
            });
        });
    },
};