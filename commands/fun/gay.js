module.exports = {
    name: 'gay',
    aliases: ['gayrate'],
    description: 'Gets how gay the specified member is.',
    usage: '(member)',
    examples: [
        '@Nevysian#2014',
    ],
    execute(bot, msg, args, functions) {
        const member = msg.guild.members.cache.get(args[0]) || args.join(' ') || msg.member;
        const gayness = Math.floor(Math.random() * 100);
        functions.send_embed(msg, `${member} is \`${gayness}%\` gay 🏳️‍🌈.`, { color: 'RANDOM' });
    },
};