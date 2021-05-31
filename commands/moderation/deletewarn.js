const { MessageEmbed } = require('discord.js');
const { max_reason_length } = require('../../config.json');

module.exports = {
    name: 'deletewarn',
    aliases: ['delwarn', 'deletewarning'],
    description: 'Deletes a warn from a member by the specified id.',
    usage: '(warn id) (reason)',
    examples: [
        '1',
        '1 Invalid warn.',
    ],
    member_permissions: ['MANAGE_ROLES'],
    arguments: true,
    cooldown: '5s',
    execute(bot, msg, args, functions, db) {
        const warn_id = Number(args[0]);
        const reason = args.slice(1).join(' ') || 'No reason given';
        if(!warn_id) return functions.send_embed(msg, 'You didn\'t specify a valid warn id.');
        if(reason.length > max_reason_length) return functions.send_embed(msg, `The reason can't be longer than \`${max_reason_length}\` characters.`);
        db.query(`SELECT * FROM warnings WHERE guild_id = '${msg.guild.id}' AND id = ${warn_id}`, (err, warns) => {
            if(err) return functions.log_error(err);
            if(!warns[0]) return functions.send_embed(msg, 'You didn\'t specify a valid warn id.');
            db.query(`DELETE FROM warnings WHERE guild_id = '${msg.guild.id}' AND id = ${warn_id}`, err => {
                if(err) return functions.log_error(err);
                functions.send_embed(msg, `The warn ${warn_id} has been deleted from <@!${warns[0].member_id}>`);
                const command_log = new MessageEmbed()
                .setDescription(`A warn has been deleted by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Victim', `<@!${warns[0].member_id}>`, true)
                .addField('Warn Reason', warns[0].reason, true)
                .addField('Reason', reason, true);
                functions.log_command(this.name, command_log, msg, { guild_id: msg.guild.id, member_id: warns[0].member_id, log_by: msg.author.id, type: 'Delete Warn', reason: reason });
            });
        });
    },
};