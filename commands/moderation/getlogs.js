const ms = require('ms');

module.exports = {
    name: 'getlogs',
    aliases: ['logsof', 'userlogs'],
    description: 'Gets all the logs or actions done on the specified user.',
    usage: '(user) (page)',
    examples: [
        '@Nevysian#2014',
        '@Nevysian#2014 2',
    ],
    member_permissions: ['VIEW_AUDIT_LOG'],
    cooldown: '10s',
    arguments: true,
    execute(bot, msg, args, functions, db) {
        const user_id = (msg.mentions.users.first() || { id: args[0].replace(/\D/g, '') }).id;
        const page = Number(args[1]) || 1;
        if(!user_id) return functions.send_embed(msg, 'You didn\'t specify a valid user.');
        db.query(`SELECT * FROM logs WHERE guild_id = '${msg.guild.id}' AND member_id = '${user_id}'`, (err, logs) => {
            if(err) return functions.log_error(err);
            if(!logs.length) return functions.send_embed(msg, 'That user doesn\'t have any logs.');
            const max_page = Math.ceil(logs.length / 25);
            if(page > max_page) return functions.send_embed(msg, `The page can't be higher than \`${max_page}\`.`);
            const items_amount = 25 * (page - 1);
            const logs_page = logs.slice(items_amount, items_amount + 25);
            const logs_embed = functions.embed()
            .setDescription(`<@!${user_id}>'s Logs [${logs.length.toLocaleString()}]`)
            .setFooter(`${functions.fix_user(msg.author)} | Page: ${page}/${max_page}`, msg.author.displayAvatarURL({ dynamic: true }));
            logs_page.forEach(log => {
                const log_data = {
                    'Log By': `<@!${log.log_by}>`,
                    'Type': log.type,
                    'Reason': log.reason,
                    'Created At': functions.to_date(log.created_at),
                    'Expires At': log.duration ? functions.to_date(Date.now() + log.duration) : 'Never',
                    'Duration': log.duration ? ms(log.duration, { long: true }) : 'Permanent',
                };
                const log_fields = Object.keys(log_data).map(d => `**- ${d}:** ${log_data[d]}`);
                logs_embed.addField(`Log ${log.id}`, log_fields);
            });
            msg.channel.send(logs_embed);
        });
    },
};