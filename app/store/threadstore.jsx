// @flow
import Reflux from 'reflux';
import { ConfigStore } from './configstore';

const fs = require('fs');
const moment = require('moment');
const path = require('path');

export const ThreadActions = Reflux.createActions({
  clear: {},
  export: { children: ['completed'] },
  loadFile: {},
  toggleSelection: {},
});

/**
 * Store for locally-archived conversation information.
 *
 * @export
 * @class ThreadStore
 * @extends {Reflux.Store}
 */
export class ThreadStore extends Reflux.Store {
  /**
   * Creates an instance of ThreadStore.
   * @memberof ThreadStore
   */
  constructor() {
    super();
    this.state = {
      export: '',
      thread: [],
    };
    this.listenables = ThreadActions;
    this.userMap = {};
    this.teamInfo = {};
  }

  /**
   * Clear the store's current state.
   *
   * @returns {void} Nothing
   * @memberof ThreadStore
   */
  onClear() {
    this.setState({
      export: '',
      thread: [],
    });
  }

  /**
   * Load a specified file.
   *
   * @param {string} team The team folder name
   * @param {string} filename The conversation file name
   * @param {(number | void)} timestamp Optionally, the target message timestamp
   * @returns {void} Nothing
   * @memberof ThreadStore
   */
  onLoadFile(team: string, filename: string, timestamp: number | void) {
    const folder = path.join(ConfigStore.state.folder, team);
    const fqname = path.join(folder, filename);
    const teamFile = path.join(folder, '_localuser.json');
    const fileList = fs.readdirSync(folder);
    this.teamInfo = JSON.parse(fs.readFileSync(teamFile, 'utf-8'));
    this.teamInfo.filename = filename;
    fileList.forEach(file => {
      const userFile = path.join(folder, file);
      if (!file.startsWith('user-')) {
        return;
      }
      const user = JSON.parse(fs.readFileSync(userFile, 'utf-8'));
      if (user.deleted) {
        return;
      }
      this.userMap[user.id] = user;
    });
    const messages = JSON.parse(fs.readFileSync(fqname, { encoding: 'utf-8' }));
    for (let i = 0; i < messages.length; i += 1) {
      const message = messages[i];
      message.scroll_to = Number(message.ts) === timestamp;
      message.is_selected = Number(message.ts) === timestamp;
      message.is_outbound = message.user === this.teamInfo.user_id;
      if (Object.prototype.hasOwnProperty.call(this.userMap, message.user)) {
        message.user_data = this.userMap[message.user];
      } else {
        message.user_data = {
          color: '999999',
          real_name: 'Unknown User',
        };
      }
    }
    this.setState({
      thread: messages.sort((a, b) => a.ts - b.ts),
      selectedTeam: this.teamInfo.team,
    });
  }

  /**
   * Select or de-select a message.
   *
   * @param {number} ts The message timestamp
   * @param {bool} scroll Whether to scroll to the selected message
   * @returns {void} Nothing
   * @memberof ThreadStore
   */
  onToggleSelection(ts: number, scroll: boolean = false) {
    const { thread } = this.state;
    const doScroll = scroll === null ? false : scroll;
    for (let i = 0; i < thread.length; i += 1) {
      const message = thread[i];
      if (Number(message.ts) === ts) {
        message.is_selected = !message.is_selected;
        message.scroll_to = doScroll && message.is_selected;
      }
    }
    this.setState({ thread });
  }

  /**
   * Export messages to Markdown.
   *
   * @returns {void} Nothing
   * @memberof ThreadStore
   */
  onExport() {
    const { thread } = this.state;
    let markdown = `### ${this.teamInfo.team} : ${this.teamInfo.filename}\n\n`;
    for (let i = 0; i < thread.length; i += 1) {
      const message = thread[i];
      if (message.is_selected) {
        const user = this.userMap[message.user];
        const time = moment(message.ts * 1000);

        // The major differences between Slack markup an Markdown are
        // - bold print
        // - URLs
        let { text } = message;
        text = text.replace(/(\*[^\s].*[^\s]\*)/g, '**$1**');
        text = text.replace(/<!([^>]*)>/g, (str, match) => `**${match}**`);
        text = text.replace(/<@(U[0-9A-Z]*)>/g, (str, match) => {
          const namedUser = this.userMap[match];
          let printedName = 'Unknown User';
          if (namedUser) {
            if (namedUser.real_name) {
              printedName = namedUser.real_name;
            } else {
              printedName = namedUser.name;
            }
          }
          return `**${printedName}**`;
        });
        text = text.replace(/<#C[0-9A-Z]*\|([^>]*)>/g, (str, match) => `**#${match}**`);
        text = text.replace(/<([^<|]*)\|([^<>]*)>/g, '[$2]($1)');
        text = text.replace(/<([^<>]*)>/g, '[$1]($1)');
        text = text.replace(/^&gt; /g, '> ');
        markdown += ` > ${text}\n\n`;
        markdown += `${user ? user.real_name : 'Unknown User'} (${time.format('ll LT')})\n\n`;
      }
    }
    ThreadActions.export.completed(markdown);
  }

  /**
   * Set export as available.
   *
   * @param {string} text The exported Markdown text
   * @returns {void} Nothing
   * @memberof ThreadStore
   */
  onExportCompleted(text: string) {
    this.setState({ export: text });
  }
}
