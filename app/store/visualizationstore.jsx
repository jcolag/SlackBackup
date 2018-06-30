// @flow
import Reflux from 'reflux';
import { ConfigStore } from './configstore';

const fs = require('fs');
const moment = require('moment');
const path = require('path');
const sentiment = require('sentiment');
const stemmer = require('stemmer');
const syllables = require('syllable');
const flesch = require('flesch');

export const VisualizationActions = Reflux.createActions({
  clearConversations: {},
  determineReadability: { sync: false, children: ['completed'] },
  determineRelationships: { sync: false, children: ['completed'] },
  determineSentiment: { sync: false, children: ['completed'] },
  determineTimes: { sync: false, children: ['completed'] },
  determineVocabulary: { sync: false, children: ['completed'] },
  loadConversations: { sync: false },
});

/**
 * Store for visualization information.
 *
 * @export
 * @class VisualizationStore
 * @extends {Reflux.Store}
 */
export class VisualizationStore extends Reflux.Store {
  /**
   * Creates an instance of VisualizationStore.
   * @memberof VisualizationStore
   */
  constructor() {
    super();
    this.state = {
      conversations: [],
      localUser: [],
      readabilities: [],
      relationships: [],
      sentiments: [],
      times: [],
      wordList: [],
    };
    this.stores = [ConfigStore];
    this.listenables = VisualizationActions;
    this.userMap = {};
    this.teams = [];
  }

  /**
   * Reset all conversation data.
   *
   * @returns {void} Nothing
   * @memberof VisualizationStore
   */
  onClearConversations() {
    this.setState({ conversations: [] });
  }

  /**
   * Work out sentiment values for the user.
   *
   * @param {(string | void)} user Slack user ID, defaulting to the token owner
   * @returns {void} Nothing
   * @memberof VisualizationStore
   */
  onDetermineSentiment(user: string | void) {
    let sentiments = [];
    this.state.conversations.forEach(conversation => {
      conversation.forEach(msg => {
        if ((!user && msg.is_local_user) || (msg.user && msg.user === user)) {
          const sent = sentiment(msg.text);
          sent.color = msg.user_info.color;
          sent.text = msg.text;
          sent.time = moment(msg.ts * 1000).format('dddd, ll, LT');
          sent.to_user = msg.other_user ? msg.other_user : msg.user_info;
          sent.ts = Number(msg.ts);
          sent.value = ((normalized) => (normalized ? sent.comparative : sent.score));
          sentiments.push(sent);
        }
      });
    });
    sentiments = sentiments.sort((a, b) => a.ts - b.ts);
    while (sentiments[2].ts - sentiments[0].ts > 30 * 24 * 60 * 60) {
      // If early messages are more than a month older than the rest, drop them
      sentiments.shift();
    }
    this.setState({ sentiments });
    VisualizationActions.determineSentiment.completed();
  }

  /**
   * Work out relationship data for the token owner.
   *
   * @returns {void} Nothing
   * @memberof VisualizationStore
   */
  onDetermineRelationships() {
    const users = Object.getOwnPropertyNames(this.userMap);
    const relationshipsIn = [];
    const relationshipsOut = [];
    const userColors = [];
    const userNames = [];
    const relationships = [];
    for (let i = 0; i < users.length; i += 1) {
      relationshipsIn.push(0);
      relationshipsOut.push(0);
      userColors.push('#999999');
      userNames.push('Unknown User');
    }
    this.state.conversations.filter(c => c.length > 0).forEach(conversation => {
      const who = {};
      const local = conversation[0].local_user.user_id;
      const isDirect = conversation[0].filename.indexOf(`${path.sep}im-`) > 0;
      conversation.forEach(msg => {
        const index = users.indexOf(msg.user);
        if (userColors[index] === '#999999') {
          userColors[index] = msg.user_info.color;
          userNames[index] = msg.user_info.real_name;
        }
        if (!who[msg.user]) {
          who[msg.user] = 0;
        }
        who[msg.user] += 1;
      });
      if (!who[local] || who[local] === 0) {
        return;
      }
      Object.getOwnPropertyNames(who).forEach(user => {
        const weight = isDirect ? 1 : 0.5;
        if (user === local) {
          Object.getOwnPropertyNames(who).forEach(w => {
            relationshipsOut[users.indexOf(w)] += who[user] * weight;
          });
        } else {
          relationshipsIn[users.indexOf(user)] += who[user] * weight;
        }
      });
      relationshipsIn[users.indexOf(local)] = 0;
      relationshipsOut[users.indexOf(local)] = 0;
    });
    for (let i = 0; i < users.length; i += 1) {
      relationships.push({
        color: userColors[i],
        in: relationshipsIn[i],
        name: userNames[i],
        out: relationshipsOut[i],
      });
    }
    this.setState({ relationships });
    VisualizationActions.determineRelationships.completed();
  }

  /**
   * Work out vocabulary data for the specified user.
   *
   * @param {(string | void)} user Slack user ID, defaulting to the token owner
   * @returns {void} Nothing
   * @memberof VisualizationStore
   */
  onDetermineVocabulary(user: string | void) {
    const wordList = [];
    const wordCount = {};
    this.state.conversations.forEach(conversation => {
      conversation.forEach(msg => {
        if ((!user && msg.is_local_user) || (msg.user && msg.user === user)) {
          const words = msg.text.split(/[ `~!@#$%^&*()-=_+[\]{}\\|;:",./<>?\n\t]/);
          for (let i = 0; i < words.length; i += 1) {
            let stem = stemmer(words[i]);
            while (stem.endsWith('\'')) {
              stem = stem.substr(0, stem.length - 1);
            }
            if (StopWords.indexOf(stem) < 0) {
              if (!Object.prototype.hasOwnProperty.call(wordCount, stem)) {
                wordCount[stem] = {
                  color: msg.user_info.color,
                  count: 0,
                  examples: [],
                  stem,
                };
              }
              wordCount[stem].count += 1;
              wordCount[stem].examples.push(words[i]);
            }
          }
        }
      });
    });
    Object.keys(wordCount).forEach(word => {
      wordList.push(wordCount[word]);
    });
    this.setState({ wordList });
    VisualizationActions.determineVocabulary.completed();
  }

  /**
   * Work out the readability data for the specified user.
   *
   * @param {(string | void)} user Slack user ID, defaulting to the token owner
   * @returns {void} Nothing
   * @memberof VisualizationStore
   */
  onDetermineReadability(user: string | void) {
    let readabilities = [];
    this.state.conversations.forEach(conversation => {
      conversation.forEach(msg => {
        if ((!user && msg.is_local_user) || (msg.user && msg.user === user)) {
          const sentence = msg.text.split(/[.;:?!]+/).filter(s => s.length > 0).length;
          const word = msg.text
            .split(/[ `~!@#$%^&*()-=_+[\]{}\\|;:",./<>?\n\t]+/)
            .filter(s => s.length > 0)
            .length;
          const syllable = syllables(msg.text);
          const read = flesch({
            sentence,
            word,
            syllable,
          });
          readabilities.push({
            color: msg.user_info.color,
            text: msg.text,
            time: moment(msg.ts * 1000).format('dddd, ll, LT'),
            to_user: msg.other_user ? msg.other_user : msg.user_info,
            ts: Number(msg.ts),
            value: read,
          });
        }
      });
    });
    readabilities = readabilities.sort((a, b) => a.ts - b.ts);
    while (readabilities[2].ts - readabilities[0].ts > 30 * 24 * 60 * 60) {
      // If early messages are more than a month older than the rest, drop them
      readabilities.shift();
    }
    this.setState({ readabilities });
    VisualizationActions.determineReadability.completed();
  }

  /**
   * Work out the times of each post.
   *
   * @param {(string | void)} user Slack user ID, defaulting to the token owner
   * @returns {void} Nothing
   * @memberof VisualizationStore
   */
  onDetermineTimes(user: string | void) {
    const times = [];
    const spd = 86400;
    this.state.conversations.forEach(conversation => {
      conversation.forEach(msg => {
        if ((!user && msg.is_local_user) || (msg.user && msg.user === user)) {
          const words = msg.text
            .split(/[ `~!@#$%^&*()-=_+[\]{}\\|;:",./<>?\n\t]+/)
            .filter(s => s.length > 0)
            .length;
          const ts = Number(msg.ts);
          const day = Math.trunc(ts / spd) * spd;
          times.push({
            color: msg.user_info.color,
            day,
            text: msg.text,
            time: ts - day,
            to_user: msg.other_user ? msg.other_user : msg.user_info,
            ts,
            words,
          });
        }
      });
    });
    times.sort((a, b) => a.ts - b.ts);
    while (times[2].day - times[0].day >= 30 * spd) {
      times.shift();
    }
    this.setState({ times });
    VisualizationActions.determineTimes.completed();
  }

  /**
   * Load all conversations into memory for processing.
   *
   * @returns {void} Nothing
   * @memberof VisualizationStore
   */
  onLoadConversations() {
    const { folder } = ConfigStore.state;
    const subdirs = fs.readdirSync(folder);
    const files = [];
    subdirs.forEach(d => {
      const dir = path.join(folder, d);
      if (fs.lstatSync(dir).isDirectory()) {
        const info = JSON.parse(fs.readFileSync(path.join(folder, d, '_localuser.json'), 'utf-8'));
        info.folder = info.team.toLowerCase().replace(' ', '_');
        this.teams.push(info);
        const fileList = fs.readdirSync(dir);
        fileList.forEach(file => {
          const fqname = path.join(folder, d, file);
          if (file.startsWith('user-') && file.endsWith('.json')) {
            const user = JSON.parse(fs.readFileSync(fqname, 'utf-8'));
            this.userMap[user.id] = user;
          }
        });
        fileList.forEach(file => {
          if (!file.endsWith('.json')) {
            return;
          }
          const fqname = path.join(folder, d, file);
          if (file.startsWith('user-')) {
            // Already processed above.
          } else if (file !== '_localuser.json' && file !== 'im-slackbot.json') {
            // Already processed the user above and Slackbot/notes aren't good data
            const messages = JSON.parse(fs.readFileSync(fqname, 'utf-8'));
            const users = messages
              .map(m => m.user)
              .filter((v, i, a) => v !== info.user_id && a.indexOf(v) === i);
            const otherUser = users.length === 1 ? this.userMap[users[0]] : null;
            for (let i = 0; i < messages.length; i += 1) {
              const message = messages[i];
              message.filename = fqname;
              message.local_user = info;
              message.other_user = otherUser;
            }
            files.push(messages);
          }
        });
        this.teams[this.teams.length - 1].user = this.userMap[info.user_id];
      }
    });
    const noUser = {
      color: '999999',
      real_name: 'Unknown User',
    };
    files.forEach(conversation => {
      for (let i = 0; i < conversation.length; i += 1) {
        const message = conversation[i];
        message.user_info = message.user ? this.userMap[message.user] : noUser;
        message.is_local_user = message.user
          ? (message.user === message.local_user.user_id)
          : false;
      }
    });
    this.setState({
      localUser: this.teams,
      conversations: files,
    });
  }
}

// A list of English words that are unlikely to convey much information
export const StopWords = [
  '',
  'a',
  'about',
  'above',
  'above',
  'across',
  'after',
  'afterwards',
  'again',
  'against',
  'all',
  'almost',
  'alone',
  'along',
  'already',
  'also',
  'although',
  'always',
  'am',
  'among',
  'amongst',
  'amoungst',
  'amount',
  'an',
  'and',
  'another',
  'any',
  'anyhow',
  'anyone',
  'anything',
  'anyway',
  'anywhere',
  'are',
  'around',
  'as',
  'at',
  'back',
  'be',
  'became',
  'because',
  'become',
  'becomes',
  'becoming',
  'been',
  'before',
  'beforehand',
  'behind',
  'being',
  'below',
  'beside',
  'besides',
  'between',
  'beyond',
  'bill',
  'both',
  'bottom',
  'but',
  'by',
  'call',
  'can',
  'cannot',
  'cant',
  'co',
  'con',
  'could',
  'couldnt',
  'cry',
  'de',
  'describe',
  'detail',
  'do',
  'done',
  'down',
  'due',
  'during',
  'each',
  'eg',
  'eight',
  'either',
  'eleven',
  'else',
  'elsewhere',
  'empty',
  'enough',
  'etc',
  'even',
  'ever',
  'every',
  'everyone',
  'everything',
  'everywhere',
  'except',
  'few',
  'fifteen',
  'fify',
  'fill',
  'find',
  'fire',
  'first',
  'five',
  'for',
  'former',
  'formerly',
  'forty',
  'found',
  'four',
  'from',
  'front',
  'full',
  'further',
  'get',
  'give',
  'go',
  'had',
  'has',
  'hasnt',
  'have',
  'he',
  'hence',
  'her',
  'here',
  'hereafter',
  'hereby',
  'herein',
  'hereupon',
  'hers',
  'herself',
  'him',
  'himself',
  'his',
  'how',
  'however',
  'hundred',
  'i',
  'ie',
  'if',
  'in',
  'inc',
  'indeed',
  'interest',
  'into',
  'is',
  'it',
  'its',
  'itself',
  'keep',
  'last',
  'latter',
  'latterly',
  'least',
  'less',
  'ltd',
  'made',
  'many',
  'may',
  'me',
  'meanwhile',
  'might',
  'mill',
  'mine',
  'more',
  'moreover',
  'most',
  'mostly',
  'move',
  'much',
  'must',
  'my',
  'myself',
  'name',
  'namely',
  'neither',
  'never',
  'nevertheless',
  'next',
  'nine',
  'no',
  'nobody',
  'none',
  'noone',
  'nor',
  'not',
  'nothing',
  'now',
  'nowhere',
  'of',
  'off',
  'often',
  'on',
  'once',
  'one',
  'only',
  'onto',
  'or',
  'other',
  'others',
  'otherwise',
  'our',
  'ours',
  'ourselves',
  'out',
  'over',
  'own',
  'part',
  'per',
  'perhaps',
  'please',
  'put',
  'rather',
  're',
  'same',
  'see',
  'seem',
  'seemed',
  'seeming',
  'seems',
  'serious',
  'several',
  'she',
  'should',
  'show',
  'side',
  'since',
  'sincere',
  'six',
  'sixty',
  'so',
  'some',
  'somehow',
  'someone',
  'something',
  'sometime',
  'sometimes',
  'somewhere',
  'still',
  'such',
  'system',
  'take',
  'ten',
  'than',
  'that',
  'the',
  'their',
  'them',
  'themselves',
  'then',
  'thence',
  'there',
  'thereafter',
  'thereby',
  'therefore',
  'therein',
  'thereupon',
  'these',
  'they',
  'thickv',
  'thin',
  'third',
  'this',
  'those',
  'though',
  'three',
  'through',
  'throughout',
  'thru',
  'thus',
  'to',
  'together',
  'too',
  'top',
  'toward',
  'towards',
  'twelve',
  'twenty',
  'two',
  'un',
  'under',
  'until',
  'up',
  'upon',
  'us',
  'very',
  'via',
  'was',
  'we',
  'well',
  'were',
  'what',
  'whatever',
  'when',
  'whence',
  'whenever',
  'where',
  'whereafter',
  'whereas',
  'whereby',
  'wherein',
  'whereupon',
  'wherever',
  'whether',
  'which',
  'while',
  'whither',
  'who',
  'whoever',
  'whole',
  'whom',
  'whose',
  'why',
  'will',
  'with',
  'within',
  'without',
  'would',
  'yet',
  'you',
  'your',
  'yours',
  'yourself',
  'yourselves',
  'the'
];
