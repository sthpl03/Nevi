const fetch = require('node-fetch');

module.exports = {
    name: 'corona',
    aliases: ['coronastatus', 'covid', 'covidstatus'],
    description: 'Gets the current status on the world or on the specified country of the current pandemic.',
    usage: '(country | Global)',
    examples: [
        'United States',
        'Global',
    ],
    cooldown: '10s',
    async execute(bot, msg, args, functions) {
        const corona_api = await fetch('https://api.covid19api.com/summary').then(res => res.json());
        if(corona_api.Message) return functions.send_embed(msg, `There was a problem while fetching the corona api | Error: \`${corona_api.Message}\``);
        const location = corona_api.Countries.find(country => country.Country.toLowerCase().includes((args.join(' ') || 'Global').toLowerCase())) || corona_api.Global;
        const help_links = {
            'Advice for public': 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public',
            'Donate Here ❤️': 'https://covid19responsefund.org',
        };
        const corona_status = functions.embed(msg.author, { title: 'Covid-19 Status' })
        .setDescription(`${location.Country || 'Global'} status`)
        .addField('Total Confirmed', location.TotalConfirmed.toLocaleString())
        .addField('Total Deaths', location.TotalDeaths.toLocaleString())
        .addField('Total Recovered', location.TotalRecovered.toLocaleString())
        .addField('Help against the pandemic', Object.keys(help_links).map(k => `- [${k}](${help_links[k]})`))
        .setColor('#d24040');
        msg.channel.send(corona_status);
    },
};