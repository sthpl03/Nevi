module.exports = {
    name: 'ship',
    aliases: ['love'],
    description: 'Gets the amount of love the specified members have between each other.',
    usage: '(member) (member)',
    examples: [
        '@Nevysian#2014 @Nevysian2#2014',
    ],
    arguments: true,
    execute(bot, msg, args, functions) {
        const member = msg.guild.members.cache.get(args[0]) || args[0] || msg.member;
        const member2 = msg.guild.members.cache.get(args[1]) || args.slice(1).join(' ');
        if(!member2 || member == member2) return functions.send_embed(msg, 'You didn\'t specify valid members.');
        const love = Math.floor(Math.random() * 100);
        functions.send_embed(msg, `${member} is \`${love}%\` in love with ${member2}. ❤️`, { color: '#d62d42' });
    },
};