const Config = require('../../config.json');
const fs = require('fs');
const ms = require('ms');

module.exports = {
    name: 'help',
    aliases: ['cmds', 'commands'],
    description: 'Gives you the info of the specified command or the full list of commands.',
    usage: '(command)',
    examples: [
        'mute',
    ],
    execute(bot, msg, args, functions, db) {
        const command = bot.commands.get(bot.aliases.get((args[0] || '').toLowerCase()) || (args[0] || '').toLowerCase());
        db.query(`SELECT prefix FROM guild_settings WHERE guild_id = '${msg.guild.id}'`, (err, guilds) => {
            if(err) return functions.log_error(err);
            const guild_settings = guilds[0] || {
                prefix: Config.prefix,
            };
            if(command) {
                db.query(`SELECT * FROM commands WHERE guild_id = '${msg.guild.id}' AND command = '${command.name}'`, (err, commands) => {
                    if(err) return functions.log_error(err);
                    const command_settings = commands[0] || {
                        disabled: 0,
                        cooldown: ms(command.cooldown || '3s'),
                    };
                    const command_data = {
                        aliases: (command.aliases || []).map(alias => `\`${alias}\``),
                        examples: (command.examples || []).map(ex => `- ${guild_settings.prefix}${command.name} ${ex}`),
                        permissions: (command.member_permisisions || []).concat(command.permissions || []).map(p => `\`${p}\``),
                    };
                    if(!command.arguments) command_data.examples.splice(0, 0, `- ${guild_settings.prefix}${command.name}`);
                    const command_info = functions.embed(msg.author, { title: '' })
                    .setAuthor(`${Config.name} - ${command.name}`, bot.user.displayAvatarURL({ dynamic: true }), Config.invite)
                    .setDescription(command.description || 'This command doesn\'t have a description.');
                    if(command.fields) command_info.addFields(command.fields);
                    command_info.addField(`Aliases [${command_data.aliases.length}]`, command_data.aliases.join(', ') || 'This command doesn\'t have any aliases.', true)
                    .addField('Cooldown', ms(command_settings.cooldown, { long: true }), true)
                    .addField('Arguments', command.arguments ? 'Yes' : 'No', true)
                    .addField('Disabled', command_settings.disabled ? 'Yes' : 'No', true)
                    .addField('Usage', `${guild_settings.prefix}${command.name} ${command.usage || ''}`, true)
                    .addField('Usage Examples', command_data.examples || 'This command doesn\'t have any examples.')
                    .addField(`Permissions Needed [${command_data.permissions.length}]`, command_data.permissions.join(', ') || 'This command doesn\'t need any permission.');
                    msg.channel.send(command_info);
                });
            }
            else {
                const command_list = functions.embed()
                .setThumbnail(bot.user.displayAvatarURL({ dynamic: true }))
                .setFooter(`Total Commands: ${bot.commands.size}`);
                fs.readdirSync('./commands/').forEach(dir => {
                    const capitalized = dir[0].toUpperCase() + dir.slice(1);
                    const commands = [];
                    const js_files = fs.readdirSync(`./commands/${dir}`).filter(file => file.endsWith('.js'));
                    js_files.forEach(file => {
                        const pull = require(`../${dir}/${file}`);
                        if(pull.name) commands.push(`\`${pull.name}\``);
                    });
                    command_list.addField(`${capitalized} [${commands.length}]`, commands.join(', '));
                });
                const links = {
                    'Invite Me!': Config.invite,
                    'Vote Me!': Config.vote_link,
                    'Community & Support Server': Config.server_invite,
                };
                command_list.addField('Links', Object.keys(links).map(k => `- [${k}](${links[k]})`))
                .addField('Server Prefix', guild_settings.prefix);
                msg.author.send(command_list).then(() => {
                    functions.send_embed(msg, 'I have sent you the command list, check your dms!');
                }, e => {
                    functions.send_embed(msg, `There was a problem while DMing you the command list | Error: \`${e.message}\``);
                });
            }
        });
    },
};