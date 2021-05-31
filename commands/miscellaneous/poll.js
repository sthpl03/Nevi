module.exports = {
    name: 'poll',
    aliases: ['createpoll'],
    description: 'Creates a poll from the topic specified.',
    usage: '(message) [(choice1)] [(choice2)]',
    examples: [
        'Is this an example? [Yes] [No]',
    ],
    permissions: ['ADD_REACTIONS'],
    member_permissions: ['MANAGE_MESSAGES'],
    cooldown: '15s',
    arguments: true,
    execute(bot, msg, args, functions) {
        const topic = args.join(' ').split('[')[0];
        const choices = (args.join(' ').match(/(?<=\[).*?(?=\])/g) || []).filter(c => c.trim()).map(c => `**${c}**`);
        if(!topic) return functions.send_embed(msg, 'You didn\'t specify the topic of the poll.');
        if(choices.length < 2 || choices.length > 10) return functions.send_embed(msg, 'You can only put `2` to `10` choices.');
        const poll = functions.embed(msg.author, { title: `📋 ${topic}` })
        .setDescription(`${choices.slice(0, -1).join(', ')} or ${choices.slice(-1)}`)
        .setColor('#C1694F');
        msg.channel.send(poll).then(m => {
            const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            for(let index = 0; index < choices.length; index++) m.react(emojis[index]);
            msg.delete();
        });
    },
};