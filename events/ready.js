exports.run = (bot, db, functions, Config) => {
    console.log(`${Config.name} has been loaded!`);
    bot.user.setActivity(`${Config.prefix}help`, { type: 'WATCHING' });
    db.query('SELECT * FROM bans', (err, bans) => {
        if(err) return functions.log_error(err);
        bans.forEach(ban => {
            const time_left = (ban.created_at + ban.duration) - Date.now();
            setTimeout(() => {
                bot.shard.broadcastEval(`
                const guild = this.guilds.cache.get('${ban.guild_id}');
                if(guild && guild.available) guild.members.unban('${ban.member_id}', 'Time ran out');
                `).then(() => db.query(`DELETE FROM bans WHERE id = ${ban.id}`), () => true);
            }, time_left);
        });
    });
    db.query('SELECT * FROM kicks', (err, kicks) => {
        if(err) return functions.log_error(err);
        kicks.forEach(kick => {
            const time_left = (kick.created_at + kick.duration) - Date.now();
            if(!kick.duration || time_left) {
                bot.shard.broadcastEval(`
                const guild = this.guilds.cache.get('${kick.guild_id}');
                if(guild && guild.available) {
                    const member = guild.members.cache.get('${kick.member_id}');
                    if(member && member.kickable) member.kick(${JSON.stringify(kick.reason)});
                }
                `).catch(() => true);
            }
            if(kick.duration) setTimeout(() => db.query(`DELETE FROM kicks WHERE id = ${kick.id}`), time_left);
        });
    });
    db.query('SELECT * FROM reminders', (err, reminders) => {
        if(err) return functions.log_error(err);
        reminders.forEach(reminder => {
            const time_left = (reminder.created_at + reminder.duration) - Date.now();
            setTimeout(() => {
                bot.shard.broadcastEval(`
                const user = this.users.cache.get('${reminder.member_id}');
                if(user) {
                    const { MessageEmbed } = require('discord.js');
                    const reminder = new MessageEmbed()
                    .setTitle('${Config.name} - Reminder :clock3:')
                    .setDescription(${JSON.stringify(reminder.reason)})
                    .setColor('#99AAB5')
                    .setFooter('Created At', user.displayAvatarURL({ dynamic: true }))
                    .setTimestamp(new Date(${reminder.created_at}));
                    user.send(reminder);
                }
                `).then(() => db.query(`DELETE FROM reminders WHERE id = ${reminder.id}`), () => true);
            }, time_left);
        });
    });
    db.query('SELECT * FROM roles', (err, roles) => {
        if(err) return functions.log_error(err);
        roles.forEach(role => {
            const time_left = (role.created_at + role.duration) - Date.now();
            if(!role.duration || time_left) {
                bot.shard.broadcastEval(`
                const guild = this.guilds.cache.get('${role.guild_id.id}');
                if(guild && guild.available) {
                    const role = guild.roles.cache.get('${role.role_id}');
                    const member = guild.members.cache.get('${role.member_id}');
                    if(role && role.editable && !role.permissions.has('ADMINISTRATOR') && member) member.roles.add(role, ${JSON.stringify(role.reason)});
                }
                `);
            }
            if(role.duration) {
                setTimeout(() => {
                    bot.shard.broadcastEval(`
                    const guild = this.guilds.cache.get('${role.guild_id}');
                    if(guild && guild.available) {
                        const role = guild.roles.cache.get('${role.role_id}');
                        const member = guild.members.cache.get('${role.member_id}');
                        if(role && role.editable && member) member.roles.remove(role, 'Time ran out');
                    }
                    `).then(() => db.query(`DELETE FROM roles WHERE id = ${role.id}`), () => true);
                }, time_left);
            }
        });
    });
};