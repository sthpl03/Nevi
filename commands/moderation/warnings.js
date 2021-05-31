module.exports = {
    name: 'warnings',
    aliases: ['getwarnings', 'warns'],
    description: 'Gets the warnings of the specified user.',
    usage: '(user) (page)',
    examples: [
        '@Nevysian#2014',
        '@Nevysian#2014 2',
    ],
    arguments: true,
    member_permissions: ['VIEW_AUDIT_LOG'],
    execute(bot, msg, args, functions, db) {
        const user_id = (msg.mentions.users.first() || { id: args[0].replace(/\D/g, '') }).id;
        const page = Number(args[1]) || 1;
        db.query(`SELECT * FROM warnings WHERE guild_id = '${msg.guild.id}' AND member_id = '${user_id}'`, (err, warnings) => {
            if(err) return functions.log_error(err);
            if(!warnings.length) return functions.send_embed(msg, 'That user doesn\'t have any warnings.');
            const max_page = Math.ceil(warnings.length / 25);
            if(page > max_page) return functions.send_embed(msg, `The page can't be higher than \`${max_page}\`.`);
            const items_amount = 25 * (page - 1);
            const warns_page = warnings.slice(items_amount, items_amount + 25);
            const warns_embed = functions.embed()
            .setColor('#FFCC4D')
            .setDescription(`<@!${user_id}>'s Warnings [${warnings.length}] ⚠️`)
            .setFooter(`${functions.fix_user(msg.author)} | Page: ${page}/${max_page}`, msg.author.displayAvatarURL({ dynamic: true }));
            warns_page.forEach(warn => {
                const warn_data = {
                    'Warned By': `<@!${warn.warned_by}>`,
                    'Reason': warn.reason,
                    'Created At': functions.to_date(warn.created_at),
                };
                const warn_fields = Object.keys(warn_data).map(d => `**- ${d}:** ${warn_data[d]}`);
                warns_embed.addField(`Warn ${warn.id}`, warn_fields);
            });
            msg.channel.send(warns_embed);
        });
    },
};