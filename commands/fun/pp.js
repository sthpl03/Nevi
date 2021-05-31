module.exports = {
    name: 'pp',
    aliases: ['ppsize', 'inches'],
    description: 'Gets the amount of inches the specified member has.',
    usage: '(member)',
    examples: [
        '@Nevysian#2014',
    ],
    execute(bot, msg, args, functions) {
        const member = msg.guild.members.cache.get(args[0]) || args.join(' ') || msg.member;
        const inches = Math.floor(Math.random() * 20);
        functions.send_embed(msg, `${member} has \`${inches}\` inches.`);
    },
};