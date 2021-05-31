const { Collection } = require('discord.js');
const on_cooldown = new Collection();
const fs = require('fs');
const ms = require('ms');

exports.run = async (bot, db, functions, Config, msg) => {
    if(msg.author.bot) return;
    if(msg.channel.type == 'dm') return;
    if(!msg.channel.permissionsFor(bot.user).has('SEND_MESSAGES')) return;
    db.query(`SELECT prefix FROM guild_settings WHERE guild_id = '${msg.guild.id}'`, (err, guilds) => {
        if(err) return functions.log_error(err);
        const guild_settings = guilds[0] || {
            prefix: Config.prefix,
        };
        const prefix = guild_settings.prefix;
        const args = msg.content.slice(prefix.length).trim().split(' ');
        const command_name = args.shift().toLowerCase();
        const command = bot.commands.get(bot.aliases.get(command_name) || command_name);
        if(!msg.content.startsWith(prefix)) {
            if(msg.mentions.users.has(bot.user.id)) {
                if(!msg.channel.permissionsFor(bot.user).has('EMBED_LINKS')) return msg.channel.send('I must have the `EMBED_LINKS` permission to execute any command.');
                functions.send_embed(msg, `The prefix for this server is: \`${prefix}\``);
            }
            return;
        }
        if(!command) return;
        if(!msg.channel.permissionsFor(bot.user).has('EMBED_LINKS')) return msg.channel.send('I must have the `EMBED_LINKS` permission to execute any command.');
        const category = fs.readdirSync('./commands/').find(d => fs.readdirSync(`./commands/${d}`).some(f => require(`../commands/${d}/${f}`).name == command.name));
        function handle_execution(command_settings, permissions) {
            const member_permissions = (command.member_permissions || []).concat(command.permissions || []);
            const bot_permissions = (command.bot_permissions || []).concat(command.permissions || []);
            if(member_permissions.length || bot_permissions.length) {
                const member_disabled_perms = member_permissions.filter(p => !msg.member.permissions.has(p));
                const bot_disabled_perms = bot_permissions.filter(p => !msg.guild.me.permissions.has(p));
                if(member_disabled_perms.length && !permissions.length) return functions.send_embed(msg, `You must have the \`${member_disabled_perms.join(', ')}\` permission(s) to use this command.`);
                if(bot_disabled_perms.length) return functions.send_embed(msg, `I must have the \`${bot_disabled_perms.join(', ')}\` permission(s) to execute this command.`);
            }
            if(command.arguments && !args.length) return functions.send_embed(msg, `Not enough arguments! Do \`${prefix}help ${command_name}\` to see the information of this command.`);
            const command_cooldown = command_settings.cooldown || ms(command.cooldown || '3s');
            if(!on_cooldown.has(command.name)) on_cooldown.set(command.name, new Collection());
            const timestamps = on_cooldown.get(command.name);
            const expires_at = timestamps.get(msg.author.id);
            if(expires_at) {
                const time_left = ms(expires_at - Date.now(), { long: true });
                return functions.send_embed(msg, `You are on cooldown! Wait another \`${time_left}\` to use this command again.`);
            }
            else {
                timestamps.set(msg.author.id, Date.now() + command_cooldown);
                setTimeout(() => timestamps.delete(msg.author.id), command_cooldown);
            }
            command.execute(bot, msg, args, functions, db);
        }
        db.query(`SELECT * FROM commands WHERE guild_id = '${msg.guild.id}' AND command = '${command.name}'`, (err, commands) => {
            if(err) return functions.log_error(err);
            const command_settings = commands[0] || {
                disabled: 0,
                cooldown: 0,
            };
            if(command_settings.disabled) return;
            db.query(`SELECT * FROM categories WHERE guild_id = '${msg.guild.id}' AND category = '${category}'`, (err, categories) => {
                if(err) return functions.log_error(err);
                const whitelisted_commands = ['ping', 'help', 'botinfo', 'category', 'command'];
                if(categories.length && !whitelisted_commands.some(c => command.name == c)) return;
                db.query(`SELECT disabled FROM permissions WHERE guild_id = '${msg.guild.id}' AND role_id = '${msg.member.roles.highest.id}' AND (permission = '${command.name}' OR permission = '${category}' OR permission = 'all')`, (err, permissions) => {
                    if(err) return functions.log_error(err);
                    const permission = permissions[0] || {
                        disabled: 0,
                    };
                    if(permission.disabled) return functions.send_embed(msg, 'You don\'t have permissions to use this command.');
                    handle_execution(command_settings, permissions);
                });
            });
        });
    });
};