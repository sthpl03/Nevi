const { MessageEmbed } = require('discord.js');
const { max_reason_length } = require('../../config.json');

module.exports = {
    name: 'kick',
    description: 'Kicks the specified member from the guild for the reason given.',
    usage: '(member) (reason)',
    examples: [
        '@Nevysian#2014',
        '@Nevysian#2014 Breaking the rules!',
    ],
    arguments: true,
    permissions: ['KICK_MEMBERS'],
    async execute(bot, msg, args, functions) {
        const member = msg.guild.members.cache.get(args[0]) || msg.mentions.members.first();
        const reason = args.slice(1).join(' ') || 'No reason given.';
        if(!member) return functions.send_embed(msg, 'You didn\'t specify a valid member.');
        if(member.roles.highest.position >= msg.member.roles.highest.position || member.id == msg.author.id) return functions.send_embed(msg, 'You don\'t have permissions to kick that member.');
        if(!member.kickable) return functions.send_embed(msg, 'I don\'t have permissions to kick that member.');
        if(reason.length > max_reason_length) return functions.send_embed(msg, `The reason can't be longer than \`${max_reason_length}\` characters.`);
        await functions.send_embed(member, `You have been kicked from \`${msg.guild.name}\` | ${reason}`);
        member.kick(reason).then(() => {
            functions.send_embed(msg, `\`${member.user.tag}\` has been kicked | ${reason}`);
            const command_log = new MessageEmbed()
            .setDescription(`A member has been kicked by ${msg.author}`)
            .addField('Author', msg.author, true)
            .addField('Victim', `${member.tag} | ${member.id}`, true)
            .addField('Reason', reason, true);
            functions.log_command(this.name, command_log, msg, { guild_id: msg.guild.id, member_id: member.id, log_by: msg.author.id, reason: reason });
        }, e => {
            functions.send_embed(msg, `There was a problem while kicking that member | Error: \`${e.message}\``);
        });
    },
};