const { MessageEmbed } = require('discord.js');
const { max_reason_length } = require('../../config.json');

module.exports = {
    name: 'softban',
    description: 'Bans and unbans the specified member for the reason given to remove their messages in the specified day limit.',
    usage: '(member) (days) (reason)',
    examples: [
        '@Nevysian#2014',
        '@Nevysian#2014 Breaking the rules!',
        '@Nevysian#2014 1',
        '@Nevysian#2014 1 Breaking the rules!',
    ],
    arguments: true,
    permissions: ['BAN_MEMBERS'],
    cooldown: '10s',
    async execute(bot, msg, args, functions) {
        const member = msg.guild.members.cache.get(args[0]) || msg.mentions.members.first();
        let days = Number(args[1]);
        if(days) args.splice(1, 1);
        else days = 1;
        const reason = args.slice(1).join(' ') || 'No reason given.';
        if(!member) return functions.send_embed(msg, 'You didn\'t specify a valid member.');
        if(member.roles.highest.position >= msg.member.roles.highest.position || member.id == msg.author.id) return functions.send_embed(msg, 'You don\'t have permissions to ban that member.');
        if(!member.bannable) return functions.send_embed(msg, 'I don\'t have permissions to ban that member.');
        if(days < 1 || days > 7) return functions.send_embed(msg, 'The day limit must be between 1 and 7.');
        if(reason.length > max_reason_length) return functions.send_embed(msg, `The reason can't be longer than \`${max_reason_length}\` characters.`);
        await functions.send_embed(member, `You have been softbanned in \`${msg.guild.name}\` | ${reason}`);
        member.ban({ reason: reason, days: days }).then(() => {
            msg.guild.members.unban(member.id).then(() => {
                functions.send_embed(msg, `\`${member.user.tag}\` has been softbanned | ${reason}`);
                const command_log = new MessageEmbed()
                .setDescription(`A member has been softbanned by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Victim', `${member.user.tag} | ${member.id}`, true)
                .addField('Days', days, true)
                .addField('Reason', reason, true);
                functions.log_command(this.name, command_log, msg, { guild_id: msg.guild.id, member_id: member.id, log_by: msg.author.id, reason: reason });
            }, e => {
                functions.send_embed(msg, `There was a problem while unbanning that member | Error: \`${e.message}\``);
            });
        }, e => {
            functions.send_embed(msg, `There was a problem while banning that member | Error: \`${e.message}\``);
        });
    },
};