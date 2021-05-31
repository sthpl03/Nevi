const Discord = require('discord.js');
const bot = new Discord.Client({ disableMentions: 'everyone', ws: { intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_PRESENCES', 'GUILD_MESSAGE_REACTIONS'] } });
const Config = require('./config.json');
const fs = require('fs');
const mysql = require('mysql');
const functions = require('./functions');
const fetch = require('node-fetch');
const express = require('express');
const app = express();

bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'nevi',
  password: Config.database_password,
});

functions.bot = bot;
functions.db = db;

fs.readdirSync('./commands/').forEach(dir => {
  const commands = fs.readdirSync(`./commands/${dir}/`).filter(f => f.endsWith('.js'));
  for(const file of commands) {
    const pull = require(`./commands/${dir}/${file}`);
    if(!pull.name || !pull.execute) {
      console.log(`${file} had at problem at loading.`);
      break;
    }
    const command_name = pull.name || file.split('.js')[0].toLowerCase();
    const aliases = pull.aliases;
    bot.commands.set(command_name, pull);
    if(Array.isArray(aliases)) aliases.forEach(alias => bot.aliases.set(alias, command_name));
  }
});

fs.readdirSync('./events/').forEach(file => {
  if(!file.endsWith('.js')) return;
  const event = require(`./events/${file}`);
  const event_name = file.split('.js')[0];
  bot.on(event_name, event.run.bind(null, bot, db, functions, Config));
});

// Verification

app.use(express.urlencoded({ extended: false }));

app.listen(4000, () => {
    console.log('Server running on the port: 4000');
});

app.post('/', async req => {
  const captcha_verify = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    body: `response=${req.body['h-captcha-response']}&secret=${Config.hcaptcha_secret}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).then(res => res.json());
  if(!captcha_verify.success || !req.body.token) return;
  db.query(`SELECT * FROM verification WHERE token = ${db.escape(req.body.token)}`, (err, verifications) => {
    if(err) return functions.log_error(err);
    if(!verifications.length) return;
    const guild = bot.guilds.cache.get(verifications[0].guild_id);
    if(!guild || !guild.available) return;
    db.query(`SELECT verified_role FROM guild_settings WHERE guild_id = '${guild.id}'`, (err, guilds) => {
      if(err) return functions.log_error(err);
      if(!guilds.length) return;
      const member = guild.members.cache.get(verifications[0].member_id);
      const role = guild.roles.cache.get(guilds[0].verified_role);
      if(!member) return;
      if(!role || !role.editable || role.permissions.has('ADMINISTRATOR')) return functions.send_embed(member, 'There was a problem while giving you the verified role.');
      if(member.roles.cache.has(role.id)) return;
      member.roles.add(role, 'Verified!').then(() => {
        functions.send_embed(member, `You have been verified in \`${guild.name}\`!`);
        db.query(`DELETE FROM verification WHERE guild_id = '${guild.id}' AND member_id = '${member.id}'`);
      }, e => {
        functions.send_embed(member, `There was a problem while giving you the verified role | Error: \`${e.message}\``);
      });
    });
  });
});

process.on('warning', e => console.warn(e.stack));

process.on('unhandledRejection', console.log);

bot.login(Config.token).catch(console.log);