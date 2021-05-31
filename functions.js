const Discord = require('discord.js');
const Config = require('./config.json');
const fs = require('fs');

module.exports = {
  to_date(date) {
    return new Date(date).toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' });
  },

  truncate(string = '', max_length = 15, ending = '...') {
    string = new String(string);
    if(string.length >= max_length) string = string.slice(0, max_length - ending.length) + ending;
    return string;
  },

  fix_user(user) {
    let fixed_user = `${this.truncate(user.username)}#${user.discriminator}`;
    if(!user.username.replace(/[^a-zA-Z0-9 ]/g, '').length) fixed_user = user.id;
    return fixed_user;
  },

  embed(user, options = {}) {
    const default_options = {
      title: Config.name,
      url: Config.invite,
      color: Config.color,
      timestamp: Date.now(),
    };
    if(user) {
      default_options.footer = {
        text: this.fix_user(user),
        icon_url: user.displayAvatarURL({ dynamic: true }),
      };
    }
    options = Object.assign(default_options, options);
    if(options.title != Config.name && !options.author) {
      options.author = {
        name: Config.name,
        url: Config.invite,
      };
      options.url = '';
    }
    const embed = new Discord.MessageEmbed(options);
    return embed;
  },

  send_embed(receiver, content = '', options = {}) {
    receiver = {
      channel: receiver.channel || receiver,
      user: receiver.author || receiver.user || receiver,
    };
    options.description = content;
    return receiver.channel.send(options.header, this.embed(receiver.user, options));
  },

  log_error(error = {}, msg, description = 'An unknown error has occurred.') {
    if(!error || typeof error != 'object') return;
    if(error.message) description = `${description} | Error: \`${error.message}\``;
    const error_embed = new Discord.MessageEmbed()
    .setTitle('❌ An error has occurred!')
    .setColor('#DD2E44')
    .setFooter(this.bot.user.tag, this.bot.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp();
    Object.getOwnPropertyNames(error).forEach(key => {
      const capitalized_key = key[0].toUpperCase() + key.slice(1).toLowerCase();
      error_embed.addField(capitalized_key, this.truncate(error[key], 1024));
    });
    if(msg) error_embed.addField('Message Content', this.truncate(msg.content, 1024));
    const webhook = new Discord.WebhookClient(Config.error_logging.id, Config.error_logging.token);
    webhook.send(error_embed).then(() => {
      if(msg) this.send_embed(msg, description);
    }, console.log);
  },

  log_command(command, embed = new Discord.MessageEmbed(), msg, fields = {}) {
    if(!command) return this.log_error({ message: 'The command name wasn\'t specified.' });
    if(!embed) return this.log_error({ message: 'The embed wasn\'t specified.' });
    const category = fs.readdirSync('./commands/').find(dir => fs.readdirSync(`./commands/${dir}`).some(file => file.endsWith('.js') && require(`./commands/${dir}/${file}`).name == command));
    const capitalized_category = category[0].toUpperCase() + category.slice(1);
    embed
    .setAuthor(Config.name, null, Config.invite)
    .setTitle(`${capitalized_category} Logs`)
    .setURL(msg.url)
    .addField('Message', `[Message Link](${msg.url})`, true)
    .setColor(Config.color)
    .setFooter(this.fix_user(msg.author), msg.author.displayAvatarURL({ dynamic: true }))
    .setTimestamp();
    this.db.query(`SELECT * FROM guild_settings WHERE guild_id = '${msg.guild.id}'`, (err, guilds) => {
      if(err) return this.log_error(err);
      if(!guilds.length) return;
      const log_channels = {
        'management': guilds[0].management_logs_channel,
        'moderation': guilds[0].moderation_logs_channel,
      };
      const log_channel = msg.guild.channels.cache.get(log_channels[category]);
      if(log_channel) log_channel.send(embed);
    });
    if(Object.keys(fields).length) {
      const capitalized_command = command[0].toUpperCase() + command.slice(1).toLowerCase();
      const default_fields = {
        type: capitalized_command,
        reason: 'No reason given',
        created_at: Date.now(),
        duration: 0,
      };
      fields = Object.assign(default_fields, fields);
      this.db.query(`INSERT INTO logs(${Object.keys(fields).join(', ')}) VALUES(${Object.values(fields).map(v => this.db.escape(v)).join(', ')})`);
    }
  },

  confirmation(msg = new Discord.Message(), callback = new Function) {
    if(!msg.channel.permissionsFor(msg.client.user).has('ADD_REACTIONS')) return this.send_embed(msg, 'I must have the `ADD_REACTIONS` permissions on this channel to run this command.');
    this.send_embed(msg, 'Are you sure that you want to run this command?').then(m => {
      m.react('✅').then(() => {
        m.react('❌');
        const confirmCollector = m.createReactionCollector((reaction, user) => reaction.emoji.name == '✅' && user.id == msg.author.id, { max: 1, time: 60000 });
        const cancelCollector = m.createReactionCollector((reaction, user) => reaction.emoji.name == '❌' && user.id == msg.author.id, { max: 1, time: 60000 });
        confirmCollector.on('collect', () => {
          cancelCollector.stop();
          callback();
          m.delete();
        });
        cancelCollector.on('collect', () => {
          confirmCollector.stop();
          m.delete();
        });
      });
    });
  },
};