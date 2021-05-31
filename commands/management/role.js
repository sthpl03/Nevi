const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'role',
    description: 'Gives or removes the role given from the specified member for the reason given.',
    fields: [
        {
            name: 'Types',
            value: [
                '`give` - Gives the role to the member.',
                '`remove` - Removes the role from the member.',
            ].join('\n'),
        },
    ],
    usage: '(member | all) (type) (role), (reason)',
    examples: [
        'all Member',
        '@Nevysian#2014 Moderator',
        '@Nevysian#2014 Moderator, Application Accepted!',
        '@Nevysian#2014 give Moderator',
        '@Nevysian#2014 give Moderator, Application Accepted!',
    ],
    permissions: ['MANAGE_ROLES'],
    arguments: true,
    execute(bot, msg, args, functions) {
        const member = msg.guild.members.cache.get(args[0]) || msg.mentions.members.first() || (args[0].toLowerCase() == 'all' ? 'all' : null);
        const types = ['give', 'remove'];
        const type = types.find(t => t == (args[1] || '').toLowerCase());
        if(type) args.splice(1, 1);
        const role = msg.guild.roles.cache.get((args[1] || '').split(',')[0]) || msg.guild.roles.cache.find(r => r.name.toLowerCase().includes(args.slice(1).join(' ').split(', ')[0].toLowerCase()));
        const reason = args.slice(1).join(' ').split(', ').slice(1).join(', ') || 'No reason given.';
        if(!member) return functions.send_embed(msg, 'You didn\'t specify a valid member.');
        if(!role || role.id == msg.guild.roles.everyone.id) return functions.send_embed(msg, 'You didn\'t specify a valid role.');
        if(role.position >= msg.member.roles.highest.position) return functions.send_embed(msg, 'You don\'t have permissions to make changes to that role.');
        if(!role.editable) return functions.send_embed(msg, 'I don\'t have permissions to make changes to that role.');
        const command_log = new MessageEmbed()
        .setDescription(`Member(s)'s roles have been updated by ${msg.author}`)
        .addField('Author', msg.author, true)
        .addField('Victim', member == 'all' ? '@everyone' : member, true)
        .addField('Role', role, true)
        .addField('Reason', reason, true)
        .addField('Type', type, true);
        const type_field = command_log.fields.find(f => f.name == 'Type');
        if(member == 'all') {
            if(!msg.member.permissions.has('MANAGE_GUILD')) return functions.send_embed(msg, 'You must have the `MANAGE_GUILD` permission to use this command.');
            const members = msg.guild.members.cache.array();
            for(const current_member of members) {
                current_member.roles.add(role, 'Role All');
                if(members.indexOf(current_member) == members.length - 1) {
                    functions.send_embed(msg, `Everyone got the ${role} role.`);
                    type_field.value = 'Role All / Give';
                    functions.log_command(this.name, command_log, msg);
                }
            }
            return;
        }
        if(member.roles.cache.has(role.id)) {
            if(type == 'give') return functions.send_embed(msg, 'That member already has that role.');
            member.roles.remove(role, reason).then(() => {
                functions.send_embed(msg, `The ${role} role has been removed from ${member} | ${reason}`);
                type_field.value = 'Remove';
                functions.log_command(this.name, command_log, msg, { guild_id: msg.guild.id, member_id: member.id, log_by: msg.author.id, type: 'Unrole', reason: reason });
            }, e => {
                functions.send_embed(msg, `There was a problem while removing the ${role} role from that member | Error: \`${e.message}\``);
            });
        }
        else {
            if(type == 'remove') return functions.send_embed(msg, 'That member doesn\'t have that role already.');
            member.roles.add(role, reason).then(() => {
                functions.send_embed(msg, `The ${role} role has been given to ${member} | ${reason}`);
                type_field.value = 'Give';
                functions.log_command(this.name, command_log, msg, { guild_id: msg.guild.id, member_id: member.id, log_by: msg.author.id, reason: reason });
            }, e => {
                functions.send_embed(msg, `There was a problem while giving the ${role} role to that member | Error: \`${e.message}\``);
            });
        }
    },
};