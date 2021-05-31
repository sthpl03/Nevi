const Config = require('../../config.json');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'prefix',
    description: 'Gets or changes the server\'s prefix.',
    usage: '(prefix)',
    examples: [
        '=',
    ],
    cooldown: '10s',
    member_permissions: ['MANAGE_GUILD'],
    execute(bot, msg, args, functions, db) {
        db.query(`SELECT prefix FROM guild_settings WHERE guild_id = '${msg.guild.id}'`, (err, guilds) => {
            if(err) return functions.log_error(err);
            let sql;
            const guild_settings = guilds[0] || {
                prefix: Config.prefix,
            };
            const prefix = guild_settings.prefix;
            const new_prefix = args.join(' ');
            if(!new_prefix) return functions.send_embed(msg, `The prefix for this server is: \`${prefix}\``);
            if(new_prefix == prefix) return functions.send_embed(msg, 'The prefix for this server has already been set to that.');
            if(new_prefix.length > 25) return functions.send_embed(msg, 'The prefix can\'t be longer than `25` characters.');
            if(!guilds.length) sql = `INSERT INTO guild_settings (guild_id, prefix) VALUES('${msg.guild.id}', ${db.escape(new_prefix)})`;
            else sql = `UPDATE guild_settings SET prefix = ${db.escape(new_prefix)} WHERE guild_id = '${msg.guild.id}'`;
            db.query(sql, err => {
                if(err) return functions.log_error(err);
                functions.send_embed(msg, `The server's prefix has been set to: \`${new_prefix}\``);
                const command_log = new MessageEmbed()
                .setDescription(`The server's prefix has been changed by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Prefix', new_prefix, true);
                functions.log_command(this.name, command_log, msg);
            });
        });
    },
};