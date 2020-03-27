const Command = require('../Command.js');
const Discord = require('discord.js');
const fs = require('fs');
const YAML = require('yaml');
const { oneLine } = require('common-tags');

module.exports = class TriviaCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'trivia',
      aliases: ['triv'],
      usage: '<TOPIC>',
      description: 'Test your knowledge in a game of trivia! If no topic is given, a random one will be chosen.',
      type: 'fun'
    });
  }
  run(message, args) {
    const prefix = message.client.db.guildSettings.selectPrefix.pluck().get(message.guild.id); // Get prefix
    let topicName = args[0];
    let randomTopic = false;
    if (!topicName) { // Pick a random topic if none given
      topicName = message.client.topics[Math.floor(Math.random() * message.client.topics.length)];
      randomTopic = true;
    } else if (!message.client.topics.includes(topicName))
      return message.channel.send(oneLine`
        Sorry ${message.member}, I don't recognize that topic. Please use \`\`${prefix}topics\`\` to see a list.
      `);
    
    // Get question and answers
    const path = __basedir + '/data/trivia/' + topicName + '.yml';
    const topic = YAML.parse(fs.readFileSync(path, 'utf-8'));
    const questions = Object.keys(topic); // Get list of questions
    const n = Math.floor(Math.random() * questions.length);
    const question = questions[n];
    const answers = topic[question];
    const origAnswers = [...answers];
    // Clean answers
    for (let i = 0; i < answers.length; i++) {
      answers[i] = answers[i].trim().toLowerCase().replace(/\s/g, '');
    }

    // Get user answer
    if (randomTopic) message.channel.send(`From \`${topicName}\`: ${question}`);
    else message.channel.send(question);
    let winner;
    const collector = new Discord.MessageCollector(message.channel, m => {
      if (!m.author.bot) return true;
    }, { time: 10000 }); // Wait 10 seconds
    collector.on('collect', msg => {
      if (answers.includes(msg.content.toLowerCase().replace(/\s/g, ''))){
        winner = msg.author;
        collector.stop();
      }
    });
    collector.on('end', () => {
      if (winner) message.channel.send(`Congratulations ${winner}, you gave the correct answer!`);
      else message.channel.send(`
        Sorry ${message.member}, time's up! Better luck next time.\n\n**Correct answers**: ${origAnswers.join(', ')}
      `);
    });
  }
};