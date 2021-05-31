module.exports = {
    name: 'ping',
    description: 'Gets the latency of the bot.',
    cooldown: '5s',
    execute(bot, msg, args, functions) {
        functions.send_embed(msg, 'Pong!').then(m => {
            m.edit(functions.embed(msg.author, { description: `Pong! \`${m.createdTimestamp - msg.createdTimestamp}ms\` | Api: \`${bot.ws.ping}ms\`` })).catch(e => {
                functions.send_embed(msg, `There was a problem while editing the message | Error: \`${e.message}\``);
            });
        });
    },
};