const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'fixname',
    aliases: ['fixnickname', 'fixnick'],
    description: 'Changes the nickname of the specified member to a typable one.',
    usage: '(member)',
    examples: [
        '@Nevysian#2014',
    ],
    arguments: true,
    permissions: ['MANAGE_NICKNAMES'],
    execute(bot, msg, args, functions) {
        const member = msg.guild.members.cache.get(args[0]) || msg.mentions.members.first();
        if(!member || member.id == msg.author.id) return functions.send_embed(msg, 'You didn\'t specify a valid user.');
        if(member.roles.highest.position >= msg.member.roles.highest.position) return functions.send_embed(msg, 'You don\'t have permissions to make changes to that member.');
        if(!member.manageable) return functions.send_embed(msg, 'I don\'t have permissions to make changes to that member.');
        const fixed_username = member.user.username.replace(/[^A-Za-z0-9 ]/g, '');
        const fixed_name = fixed_username.length >= 3 ? fixed_username : `FixedName_${Math.random().toString(36).substring(2, 7)}`;
        if(member.displayName == fixed_name) return functions.send_embed(msg, 'That member\'s username has already been fixed.');
        member.setNickname(fixed_name).then(() => {
            functions.send_embed(msg, `${member}'s nickname has been set to \`${fixed_name}\``);
            const command_log = new MessageEmbed()
            .setDescription(`A member's nickname has been fixed by ${msg.author}`)
            .addField('Author', msg.author, true)
            .addField('Victim', member, true)
            .addField('Nickname', fixed_name, true);
            functions.log_command(this.name, command_log, msg, { guild_id: msg.guild.id, member_id: member.id, log_by: msg.author.id, reason: 'Nickname wasn\'t pingable' });
        }, e => {
            functions.send_embed(msg, `There was an error while changing that member's nickname | Error: \`${e.message}\``);
        });
    },
};