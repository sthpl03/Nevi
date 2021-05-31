module.exports = {
    name: 'iq',
    aliases: ['iqrate'],
    description: 'Gets the IQ of the specified member.',
    usage: '(member)',
    example: [
        '@Nevysian#2014',
    ],
    execute(bot, msg, args, functions) {
        const member = msg.guild.members.cache.get(args[0]) || args.join(' ') || msg.member;
        const iq = Math.floor(Math.random() * (200 - 1) + 1);
        functions.send_embed(msg, `${member} has \`${iq}\` IQ. 🧠`, { color: '#F4ABBA' });
    },
};