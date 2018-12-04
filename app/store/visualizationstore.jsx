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
          sent.filename = msg.filename;
          sent.text = msg.text;
          sent.time = moment(msg.ts * 1000).format('dddd, ll, LT');
          sent.to_user = msg.other_user ? msg.other_user : msg.user_info;
          sent.ts = Number(msg.ts);
          sent.value = ((normalized) => (normalized ? sent.comparative : sent.score));
          sent.words = msg.text
            .split(/[ `~!@#$%^&*()-=_+[\]{}\\|;:",./<>?\n\t]+/)
            .filter(s => s.length > 0)
            .length;
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
      userColors.push('999999');
      userNames.push({
        deleted: true,
        file: '',
        name: 'Unknown User',
        team: 'Unknown Team',
      });
    }
    this.state.conversations.filter(c => c.length > 0).forEach(conversation => {
      const who = {};
      const local = conversation[0].local_user.user_id;
      const isDirect = conversation[0].filename.indexOf(`${path.sep}im-`) > 0;
      conversation.forEach(msg => {
        const index = users.indexOf(msg.user);
        if (userColors[index] === '999999') {
          userColors[index] = msg.user_info.color;
          userNames[index] = {
            deleted: msg.user_info.deleted,
            file: conversation[0].filename,
            name: msg.user_info.real_name,
            team: msg.local_user.team,
          };
        } else if (isDirect) {
          userNames[index].file = conversation[0].filename;
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
        const weight = isDirect ? 1 : 0.25;
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
        deleted: userNames[i].deleted,
        file: userNames[i].file,
        in: relationshipsIn[i],
        name: userNames[i].name,
        out: relationshipsOut[i],
        team: userNames[i].team,
        teamColor: VisualizationStore.colorFromString(userNames[i].team),
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
            switch (words[i].toLowerCase()) {
              case 'i\'m': {
                words[i] = 'I';
                words.push('am');
                break;
              }
              case 'i\'d': {
                words[i] = 'I';
                words.push('would');
                break;
              }
              case 'i\'ll': {
                words[i] = 'I';
                words.push('will');
                break;
              }
              case 'you\'re': {
                words[i] = 'you';
                words.push('are');
                break;
              }
              case 'won\'t': {
                words[i] = 'will';
                words.push('not');
                break;
              }
              case 'can\'t': {
                words[i] = 'can';
                words.push('not');
                break;
              }
              default: {
                break;
              }
            }
            if (words[i].toLowerCase().endsWith('n\'t')) {
              words[i] = words[i].toLowerCase().substr(0, words[i].length - 3);
              words.push('not');
            } else if (words[i].toLowerCase().endsWith('\'ve')) {
              words[i] = words[i].toLowerCase().substr(0, words[i].length - 3);
              words.push('have');
            } else if (words[i].toLowerCase().endsWith('\'d')) {
              words[i] = words[i].toLowerCase().substr(0, words[i].length - 2);
              words.push('would');
            }
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
            file: conversation[0].filename,
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
    const ctz = new Date().getTimezoneOffset();
    this.state.conversations.forEach(conversation => {
      conversation.forEach(msg => {
        if ((!user && msg.is_local_user) || (msg.user && msg.user === user)) {
          const words = msg.text
            .split(/[ `~!@#$%^&*()-=_+[\]{}\\|;:",./<>?\n\t]+/)
            .filter(s => s.length > 0)
            .length;
          const ts = Number(msg.ts) - (ctz * 60);
          const day = Math.trunc(ts / spd) * spd;
          times.push({
            color: msg.user_info.color,
            day,
            file: msg.filename,
            text: msg.text,
            time: (ts + (ctz * 60)) - day,
            to_user: msg.other_user ? msg.other_user : msg.user_info,
            ts: ts + (ctz * 60),
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

  /**
   * Creates a consistently arbitrary RGB color code from a string.
   *
   * @param {string} s Input string
   * @returns {string} The color in RGB form
   * @memberof VisualizationStore
   */
  static colorFromString(s: string) {
    let hash = 0;
    let chr;
    if (s === 0) return hash;
    for (let i = 0; i < s.length; i += 1) {
      chr = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr; // eslint-disable-line no-bitwise
      hash |= 0; // eslint-disable-line no-bitwise
    }
    hash &= 0xFFFFFF; // eslint-disable-line no-bitwise
    let asHexString = (hash).toString(16);
    asHexString = `00000${asHexString}`.slice(-6);
    return `#${asHexString}`;
  }
}

// A list of English words that are unlikely to convey much information
export const StopWords = [
  '',
  'a',
  'about',
  'abov', // above
  'across',
  'after',
  'afterward', // afterwards
  'again',
  'against',
  'all',
  'almost',
  'alon', // alone
  'along',
  'alreadi', // already
  'also',
  'although',
  'alwai', // always
  'am',
  'among',
  'amongst',
  'amoungst',
  'amount',
  'an',
  'and',
  'anoth', // another
  'ani', // any
  'anybodi', // anybody
  'anyhow',
  'anyon', // anyone
  'anythi', // anything
  'anywai', // anyway
  'anywher', // anywhere
  'ar', // are
  'around',
  'as',
  'at',
  'back',
  'be', // be, being
  'becam', // becane
  'becaus', // because
  'becom', // become, becomes, becoming
  'been',
  'befor', // before
  'beforehand',
  'behind',
  'below',
  'besid', // beside, besides
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
  'describ', // describe
  'detail',
  'do',
  'done',
  'down',
  'due',
  'dure', // during
  'each',
  'eg',
  'eight',
  'either',
  'eleven',
  'els', // else
  'elsewher', // elsewhere
  'empti', // empty
  'enough',
  'etc',
  'even',
  'ever',
  'everi', // every
  'everyon', // everyone
  'everyth', // everything
  'everywher', // everywhere
  'except',
  'few',
  'fifteen',
  'fifti', // fifty
  'fill',
  'find',
  'fire',
  'first',
  'five',
  'for',
  'former',
  'formerli', // formerly
  'forti', // forti
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
  'ha', //  has
  'hasnt',
  'have',
  'he',
  'henc', // hence
  'her', // her, here, hers
  'hereaft', // hereafter
  'herebi', // hereby
  'herein',
  'hereupon',
  'herself',
  'him',
  'himself',
  'hi', // his
  'how',
  'howev', // however
  'http',
  'hundr', // hundred
  'i',
  'ie',
  'if',
  'in',
  'inc',
  'inde', // indeed
  'interest',
  'into',
  'is',
  'it', // it, its
  'itself',
  'keep',
  'last',
  'latter',
  'latterli', // latterly
  'least',
  'less',
  'ltd',
  'made',
  'mani', // many
  'mai', // may
  'me',
  'meanwhil', // meanwhile
  'might',
  'mill',
  'mine',
  'more',
  'moreov', // moreover
  'most',
  'mostli', // mostly
  'move',
  'much',
  'must',
  'my',
  'myself',
  'name', // name, namely
  'neither',
  'never',
  'nevertheless',
  'next',
  'nine',
  'no',
  'nobodi', // nobody
  'none',
  'noon', // noone
  'nor',
  'not',
  'noth', // nothing
  'now',
  'nowher', // nowhere
  'of',
  'off',
  'often',
  'on', // on, one
  'onc', // once
  'onli', // only
  'onto',
  'or',
  'other', // other, others
  'otherwis', // otherwise
  'our', // our, ours
  'ourselv', // ourselves
  'out',
  'over',
  'own',
  'part',
  'per',
  'perhap', // perhaps
  'pleas', // pleas
  'put',
  'rather',
  're',
  'same',
  'see',
  'seem', // seem, seemed, seeming, seems
  'seriou', // serious
  'sever', // several
  'she',
  'should',
  'show',
  'side',
  'sinc', // since
  'sincer', // sincere
  'six',
  'sixti', // sixty
  'so',
  'some',
  'somehow',
  'someon', // someone
  'someth', // something
  'sometim', // sometime, sometimes
  'somewher', // somewhere
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
  'themselv', // themselves
  'then',
  'thenc', // thence
  'there',
  'thereaft', // thereafter
  'therebi', // thereby
  'therefor', // therefore
  'therein',
  'thereupon',
  'these',
  'thei', // their
  'thickv',
  'thin',
  'third',
  'thi', // this
  'those',
  'though',
  'three',
  'through',
  'throughout',
  'thru',
  'thu', // thus
  'to',
  'togeth', // together
  'too',
  'top',
  'toward', // toward, towards
  'twelv', // twelve
  'twenti', // twenty
  'two',
  'un',
  'under',
  'until',
  'up',
  'upon',
  'us',
  'veri', // very
  'via',
  'wa', // was
  'we',
  'well',
  'were',
  'what',
  'whatev', // whatever
  'when',
  'whenc', // whence
  'whenev', // whenever
  'where',
  'whereaft', // whereafter
  'wherea', // whereas
  'wherebi', // whereby
  'wherein',
  'whereupon',
  'wherev', // wherever
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
  'your', // your, yours
  'yourself',
  'yourselv', // yourselves
];
