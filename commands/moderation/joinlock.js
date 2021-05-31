const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'joinlock',
    description: 'Enables or disables the access of members from joining the guild.',
    fields: [
        {
            name: 'Types',
            value: [
                '`enable` - Enables joinlock.',
                '`disable` - Disables joinlock.',
                '`status` - Shows you the status of the joinlock.',
            ].join('\n'),
        },
    ],
    usage: '(type) (reason)',
    examples: [
        'Raid.',
        'enable',
        'enable Raid.',
        'status',
    ],
    cooldown: '10s',
    permissions: ['KICK_MEMBERS'],
    member_permissions: ['MANAGE_GUILD'],
    execute(bot, msg, args, functions, db) {
        const types = ['enable', 'disable', 'status'];
        let type = types.find(t => t == (args[0] || '').toLowerCase());
        if(type) args.splice(0, 1);
        const reason = args.join(' ') || 'No reason given.';
        if(reason.length > 1024) return functions.send_embed(msg, 'The reason can\'t be longer than `1024` characters.');
        db.query(`SELECT * FROM guild_settings WHERE guild_id = '${msg.guild.id}'`, (err, guilds) => {
            if(err) return functions.log_error(err);
            let sql;
            const guild_settings = guilds[0] || {
                join_lock: 0,
                lock_reason: '',
            };
            if(type == 'status') {
                const status = functions.embed(msg.author)
                .setDescription(`${msg.guild.name}'s joinlock status`)
                .addField('Enabled', guild_settings.join_lock ? 'Yes' : 'No', true)
                .addField('Reason', guild_settings.lock_reason, true);
                msg.channel.send(status);
                return;
            }
            if(guild_settings.join_lock) {
                if(type == 'enable') return functions.send_embed(msg, 'Joinlock has already been enabled.');
                type = 'Disable',
                guild_settings.join_lock = 0;
            }
            else {
                if(type == 'disable') return functions.send_embed(msg, 'Joinlock has already been disabled.');
                type = 'Enable';
                guild_settings.join_lock = 1;
            }
            if(!guilds.length) sql = `INSERT INTO guild_settings (guild_id, join_lock, lock_reason) VALUES('${msg.guild.id}', ${guild_settings.join_lock}, ${db.escape(reason)})`;
            else sql = `UPDATE guild_settings SET join_lock = ${guild_settings.join_lock}, lock_reason = ${db.escape(reason)} WHERE guild_id = '${msg.guild.id}'`;
            db.query(sql, err => {
                if(err) return functions.log_error(err);
                functions.send_embed(msg, `Joinlock has been ${type.toLowerCase()}d | ${reason}`);
                const command_log = new MessageEmbed()
                .setDescription(`Joinlock has been ${type.toLowerCase()}d by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Type', type, true)
                .addField('Reason', reason, true);
                functions.log_command(this.name, command_log, msg);
            });
        });
    },
};