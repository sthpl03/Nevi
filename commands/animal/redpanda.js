const fetch = require('node-fetch');

module.exports = {
    name: 'redpanda',
    description: 'Gets a random red panda from the internet.',
    async execute(bot, msg, args, functions) {
        const redpanda_api = await fetch('https://some-random-api.ml/img/red_panda').then(res => res.json());
        const red_panda = functions.embed(msg.author, { title: 'Red panda!' })
        .setImage(redpanda_api.link)
        .setColor('#db8758');
        msg.channel.send(red_panda);
    },
};