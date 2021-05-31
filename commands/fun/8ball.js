module.exports = {
    name: '8ball',
    description: 'The 8ball will answer to the specified question.',
    usage: '(question)',
    examples: [
        'Is this an example?',
    ],
    arguments: true,
    execute(bot, msg, args, functions) {
        const responses = [
            'Absolutely not',
            'No',
            'Not likely',
            'Maybe not',
            'Ask again',
            'Maybe',
            'Most likely',
            'Likely',
            'Yes',
            'Absolutely',
        ];
        const random_response = responses[Math.floor(Math.random() * responses.length)];
        functions.send_embed(msg, `${random_response}. 🎱`, { color: '#E1E8ED' });
    },
};