exports.run = async (bot, db, functions, Config, msg, new_msg) => {
  if(msg.author.bot) return;
  db.query(`SELECT messages_logs_channel FROM guild_settings WHERE guild_id = '${msg.guild.id}'`, (err, guilds) => {
    if(err) return functions.log_error(err, null);
    if(!guilds.length) return;
    const messages_logs_channel = msg.guild.channels.cache.get(guilds[0].messages_logs_channel);
    if(!messages_logs_channel || !messages_logs_channel.viewable) return;
    if(msg.content == new_msg.content && msg.pinned == new_msg.pinned) return;
    const updated_message = functions.embed(msg.author, { title: 'Messages Logs' })
    .setURL(msg.url)
    .setDescription(`A [message](${msg.url}) has been updated in ${msg.channel}`)
    .addField('Author', msg.author, true)
    .addField('Channel', msg.channel, true)
    .addField('Old Content', msg.content, true)
    .addField('New Content', new_msg.content, true)
    .addField('Pinned', new_msg.pinned ? 'Yes' : 'No', true)
    .addField('Message', `[Message Link](${msg.url})`, true);
    messages_logs_channel.send(updated_message).catch(() => true);
  });
};