module.exports = {
    name: 'roleinfo',
    description: 'Gets the information of the specified role.',
    usage: '(role)',
    examples: [
        'Member',
    ],
    arguments: true,
    cooldown: '5s',
    execute(bot, msg, args, functions) {
        const role = msg.guild.roles.cache.get(args[0]) || msg.guild.roles.cache.find(r => r.name.toLowerCase().includes(args.join(' ').toLowerCase()));
        if(!role) return functions.send_embed(msg, 'You didn\'t specify a valid role.');
        const role_info = functions.embed(msg.author, { title: role.name })
        .addField('ID', role.id, true)
        .addField('Color', role.hexColor, true)
        .addField('Mentionable', role.mentionable ? 'Yes' : 'No', true)
        .addField('Hoisted', role.hoist ? 'Yes' : 'No', true)
        .addField('Members', role.members.size.toLocaleString(), true)
        .addField('Position', role.position, true)
        .addField('Created At', functions.to_date(role.createdAt))
        .setColor(role.hexColor);
        msg.channel.send(role_info);
    },
};