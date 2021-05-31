module.exports = {
    name: 'horniness',
    description: 'Gets how horny the specified member is.',
    usage: '(member)',
    examples: [
        '@Nevysian#2014',
    ],
    execute(bot, msg, args, functions) {
        const member = msg.guild.members.cache.get(args[0]) || args.join(' ') || msg.member;
        const horniness = Math.floor(Math.random() * 100);
        const levels = {
            24: { emoji: '😐', color: '#FFCC4D' },
            68: { emoji: '😏', color: '#FFCC4D' },
            100: { emoji: '🥵', color: '#EA596E' },
        };
        const level = levels[Object.keys(levels).find(k => k >= horniness)];
        functions.send_embed(msg, `${member} is \`${horniness}%\` horny. ${level.emoji}`, { color: level.color });
    },
};