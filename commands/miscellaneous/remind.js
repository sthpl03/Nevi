const { MessageEmbed } = require('discord.js');
const ms = require('ms');
const Config = require('../../config.json');

module.exports = {
    name: 'remind',
    aliases: ['reminder', 'addreminder'],
    description: 'Creates a reminder with the duration given.',
    fields: [
        {
            name: 'Types',
            value: '`active` - Shows you your active reminders.',
        },
    ],
    usage: '(duration) (reminder)',
    examples: [
        'active',
        '1d Update the bot.',
    ],
    cooldown: '10s',
    arguments: true,
    execute(bot, msg, args, functions, db) {
        if(args[0].toLowerCase() == 'active') {
            db.query(`SELECT * FROM reminders WHERE member_id = '${msg.author.id}'`, (err, reminders) => {
                if(err) return functions.log_error(err);
                if(!reminders.length) return functions.send_embed(msg, 'You don\'t have any active reminders.');
                const active_reminders = functions.embed(msg.author)
                .setDescription(`${msg.author}'s active reminders [${reminders.length}]`);
                reminders.forEach(r => {
                    const fields = {
                        'Reminder': r.reason,
                        'Created At': functions.to_date(r.created_at),
                        'Remind At': functions.to_date(Date.now() + r.duration),
                    };
                    active_reminders.addField(`Reminder ${r.id}`, Object.keys(fields).map(f => `**- ${f}:** ${fields[f]}`));
                });
                msg.channel.send(active_reminders);
            });
            return;
        }
        const duration = ms(args[0] || '0') || 0;
        const reminder = args.slice(1).join(' ');
        if(duration < ms('1h') || duration >= ms('3w')) return functions.send_embed(msg, 'You didn\'t specify a valid duration.');
        if(reminder.length < 3 || reminder.length > Config.max_reason_length) return functions.send_embed(msg, `The reminder must be between \`3\` and \`${Config.max_reason_length}\` characters.`);
        db.query(`SELECT * FROM reminders WHERE member_id = '${msg.author.id}'`, (err, reminders) => {
            if(err) return functions.log_error(err);
            if(reminders.length >= 10) return functions.send_embed(msg, 'You can only have up to `10` active reminders.');
            if(reminders.some(r => r.reminder.toLowerCase() == reminder.toLowerCase())) return functions.send_embed(msg, 'You already have that as a reminder.');
            const reminder_embed = new MessageEmbed()
            .setTitle(`${Config.name} - Reminder :clock3:`)
            .setDescription(reminder)
            .setColor('#99AAB5')
            .setFooter('Created At', msg.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
            db.query(`INSERT INTO reminders(member_id, reason, created_at, duration) VALUES('${msg.author.id}', ${db.escape(reminder)}, ${Date.now()}, ${duration})`, (err, active_reminder) => {
                if(err) return functions.log_error(err);
                functions.send_embed(msg, `I will remind you that in \`${ms(duration, { long: true })}\`.`);
                setTimeout(() => {
                    db.query(`DELETE FROM reminders WHERE id = ${active_reminder.insertId}`, err => {
                        if(err) return functions.log_error(err);
                        msg.author.send(reminder_embed);
                    });
                }, duration);
            });
        });
    },
};