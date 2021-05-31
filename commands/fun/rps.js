module.exports = {
    name: 'rps',
    description: 'Play rock, paper, scissors with the bot.',
    usage: '(decision)',
    examples: [
        'rock',
    ],
    arguments: true,
    execute(bot, msg, args, functions) {
        const responses = {
            'rock': { emoji: '🪨', weakness: 'paper' },
            'paper': { emoji: '📄', weakness: 'scissors' },
            'scissors': { emoji: '✂️', weakness: 'rock' },
        };
        const keys = Object.keys(responses);
        const decision = keys.find(k => k == args[0].toLowerCase());
        const bot_decision = keys[Math.floor(Math.random() * keys.length)];
        if(!decision) return functions.send_embed(msg, 'You didn\'t pick a valid decision.');
        if(decision == bot_decision) return functions.send_embed(msg, `I choose... ${bot_decision} ${responses[bot_decision].emoji}! It was a tie, well played! 🤝`, { color: '#FFDC5D' });
        if(bot_decision == responses[decision].weakness) return functions.send_embed(msg, `I choose... ${bot_decision} ${responses[bot_decision].emoji}! You lost, here is cookie in return. 🍪😃`, { color: '#DA9F83' });
        functions.send_embed(msg, `I choose... ${bot_decision} ${responses[bot_decision].emoji}! You won, GG! 👑`, { color: '#FFCC4D' });
    },
};