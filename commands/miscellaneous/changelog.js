const Config = require('../../config.json');

module.exports = {
    name: 'changelog',
    description: 'Gets the latest changelog of the bot.',
    cooldown: '10s',
    execute(bot, msg, args, functions) {
        const fields = {
            added: [
            ],
            updated: [
            ],
            fixed: [
            ],
        };
        // Say the fortune and the meme command aren't working because of api issues
        if(Object.keys(fields).every(field => !fields[field].length)) return functions.send_embed(msg, 'There isn\'t any latest changelog set.');
        const change_log = functions.embed(null, { title: `Changelog v${Config.version}` })
        .setAuthor(`${Config.name} has been updated!`, bot.user.displayAvatarURL({ dynamic: true }), Config.invite)
        .setDescription('The bot has been rewritten!');
        Object.keys(fields).forEach(field => {
            if(!fields[field].length) return;
            const capitalized = field[0].toUpperCase() + field.slice(1);
            change_log.addField(capitalized, fields[field].map(v => `- ${v}`));
        });
        if(msg.author.id != Config.owner_id) {
            change_log.author.name = Config.name;
            msg.author.send(change_log).then(() => {
                functions.send_embed(msg, 'I have sent you the latest changelog, check your dms!');
            }, e => {
                functions.send_embed(msg, `There was a problem while DMing you the latest changelog | Error: \`${e.message}\``);
            });
        }
        else {
            functions.confirmation(msg, () => {
                const changelogs = msg.guild.channels.cache.get('725110024350728222');
                changelogs.send('<@&742750020834426921>', change_log).then(m => {
                    m.crosspost().then(() => {
                        functions.send_embed(msg, 'The changelog has been posted!');
                    }, e => {
                        functions.send_embed(msg, `There was a problem while crossposting the changelog | Error: \`${e.message}\``);
                    });
                }, e => {
                    functions.send_embed(msg, `There was a problem while posting the changelog | Error: \`${e.message}\``);
                });
            });
        }
    },
};