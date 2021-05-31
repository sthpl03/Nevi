module.exports = {
    name: 'coinflip',
    description: 'Flips a coin and gives you the result.',
    execute(bot, msg, args, functions) {
        const results = ['Heads', 'Tails'];
        const emoji = '<a:coinSpin:724025380675256370>';
        const coin_flip = results[Math.floor(Math.random() * results.length)];
        functions.send_embed(msg, `Flipping... ${emoji}`).then(m => {
            setTimeout(() => {
                m.edit(functions.embed(msg.author, { description: `The coin landed on: **${coin_flip}.**` })).catch(e => {
                    functions.send_embed(msg, `There was a problem while editing the message | Error: \`${e.message}\``);
                });
            }, 1500);
        });
    },
};