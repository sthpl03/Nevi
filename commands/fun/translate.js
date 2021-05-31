const fetch = require('node-fetch');

module.exports = {
    name: 'translate',
    description: 'Translates the specified text from the source language to the target language.',
    usage: '(source language | auto)-(target language) (text)',
    examples: [
        'auto-es Hi!',
        'en-es Hello!',
    ],
    cooldown: '5s',
    arguments: true,
    async execute(bot, msg, args, functions) {
        const languages = args[0].split('-');
        const to_translate = args.slice(1).join(' ');
        if(!languages[1]) return functions.send_embed(msg, 'You didn\'t specify a language.');
        if(!to_translate) return functions.send_embed(msg, 'You didn\'t specify what to translate.');
        const google_translate = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURI(languages[0])}&tl=${encodeURI(languages[1])}&dt=t&dj=1&source=input&q=${encodeURI(to_translate)}`).then(res => res.json());
        if(google_translate.statusCode) return functions.log_error(google_translate, msg, `There was a problem while fetching google's translation api | Error: \`${google_translate.statusCode}\``);
        const translation = functions.embed(msg.author)
        .addField('Translation', google_translate.sentences[0].trans)
        .addField('Original Sentence', google_translate.sentences[0].orig, true)
        .addField('Source Language', google_translate.src, true);
        msg.channel.send(translation);
    },
};