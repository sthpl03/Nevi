const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'nick',
    aliases: ['nickname'],
    description: 'Changes the nickname of the specified member to the one given.',
    usage: '(member) (nickname)',
    examples: [
        '@Nevysian#2014 Nevy',
    ],
    permissions: ['MANAGE_NICKNAMES'],
    execute(bot, msg, args, functions) {
        let member = msg.guild.members.cache.get(args[0]) || msg.mentions.members.first();
        if(member) args.splice(0, 1);
        else member = msg.member;
        const nickname = args.join() || member.user.username;
        if(member.roles.highest.position >= msg.member.roles.highest.position && member.id != msg.author.id) return functions.send_embed(msg, 'You don\'t have permissions to make changes to that member.');
        if(!member.manageable) return functions.send_embed(msg, 'I don\'t have permissions to make changes to that member.');
        if(nickname == member.displayName) return functions.send_embed(msg, 'That member\'s nickname has already been set to that.');
        if(nickname.length > 32) return functions.send_embed(msg, 'The nickname can\'t be longer than `32` characters.');
        member.setNickname(nickname).then(() => {
            functions.send_embed(msg, `${member}'s nickname has been set to \`${nickname}\``);
            const command_log = new MessageEmbed()
            .setDescription(`A member's nickname has been changed by ${msg.author}`)
            .addField('Author', msg.author, true)
            .addField('Victim', member, true)
            .addField('New Nickname', nickname, true);
            functions.log_command(this.name, command_log, msg, { guild_id: msg.guild.id, member_id: member.id, log_by: msg.author.id, reason: `New Nickname: ${nickname}` });
        }, e => {
            functions.send_embed(msg, `There was a problem while changing that member's nickname | Error: \`${e.message}\``);
        });
    },
};