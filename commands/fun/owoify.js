const fetch = require('node-fetch');

module.exports = {
    name: 'owoify',
    description: 'OwOifies the specified text.',
    usage: '(text)',
    examples: [
        'OwO What\'s this?',
    ],
    arguments: true,
    async execute(bot, msg, args, functions) {
        const owoified_text = await fetch(`https://owo.l7y.workers.dev/?text=${encodeURI(args.join(' '))}`).then(res => res.text());
        functions.send_embed(msg, owoified_text, { title: 'What\'s this?' });
    },
};