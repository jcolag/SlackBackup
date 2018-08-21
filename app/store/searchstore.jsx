// @flow
import Reflux from 'reflux';
import { ConfigStore } from './configstore';

const fs = require('fs');
const Fuse = require('fuse.js');
const path = require('path');

export const SearchActions = Reflux.createActions({
  highlightMessage: {},
  highlightThread: {},
  updateFileList: {},
  updateSearchString: { sync: false },
});

/**
 * The search store.
 *
 * @export
 * @class SearchStore
 * @extends {Reflux.Store}
 */
export class SearchStore extends Reflux.Store {
  /**
   * Creates an instance of SearchStore.
   * @memberof SearchStore
   */
  constructor() {
    super();
    this.state = {
      searchFiles: [],
      searchResults: [],
      target: '',
    };
    this.listenables = SearchActions;
    this.userMap = {};
    this.teams = [];
  }

  /**
   * Read through configured target folder to get a current set of archived files.
   *
   * @returns {void} Nothing
   * @memberof SearchStore
   */
  onUpdateFileList() {
    const { folder } = ConfigStore.state;
    const subdirs = fs.readdirSync(folder);
    const files = [];
    subdirs.forEach(d => {
      const dir = path.join(folder, d);
      if (fs.lstatSync(dir).isDirectory()) {
        const fileList = fs.readdirSync(dir);
        fileList.forEach(file => {
          const fqname = path.join(folder, d, file);
          if (file.startsWith('user-')) {
            const user = JSON.parse(fs.readFileSync(fqname, 'utf-8'));
            this.userMap[user.id] = user;
          } else if (file === '_localuser.json') {
            const info = JSON.parse(fs.readFileSync(fqname, 'utf-8'));
            info.folder = info.team.toLowerCase().replace(' ', '_');
            this.teams.push(info);
          } else {
            files.push(fqname);
          }
        });
      }
    });
    const searchFiles = files.map((filename) => {
      const pathParts = filename.split(path.sep);
      const file = pathParts[pathParts.length - 1];
      const team = pathParts[pathParts.length - 2];
      const teamInfo = this.teams.filter(t => t.folder === team)[0];
      const baseName = file.split('.')[0];
      const frags = baseName.split('-');
      const fileType = frags.shift();
      const displayName = frags.join(' ');
      let user = null;
      if (filename.indexOf(`${path.sep}im-`) > 0) {
        const matches = Object.values(this.userMap)
          .filter(u => u.real_name === displayName && u.team_id === teamInfo.team_id)
          .sort((a, b) => a.updated - b.updated);
        if (matches.length > 0) {
          [user] = matches;
        }
      }
      return {
        displayName,
        file,
        fileType,
        is_selected: false,
        path: filename,
        team,
        teamInfo,
        user,
      };
    }, this);
    this.setState({ searchFiles });
  }

  /**
   * Search with the new string.
   *
   * @param {string} str The search target.
   * @returns {void} Nothing
   * @memberof SearchStore
   */
  onUpdateSearchString(str: string) {
    let user = '';
    let teamId = 'Unknown Team';
    if (str.length < 3) {
      this.setState({
        searchResults: [],
        target: '',
      });
      return;
    }

    const searchResults = [];
    SearchActions.updateFileList();
    this.state.searchFiles.forEach(file => {
      const folder = file.team;
      const userInfo = this.teams.filter(t => t.folder === folder);
      let messages = JSON.parse(fs.readFileSync(file.path, 'utf-8'));

      if (Object.prototype.toString.call(messages) !== '[object Array]') {
        return;
      }

      if (userInfo.length > 0) {
        const info = userInfo[0];
        user = info.user_id;
        teamId = info.team_id;
      }

      const fuseOptions = {
        caseSensitive: false,
        findAllMatches: true,
        includeScore: true,
        includeMatches: true,
        keys: ['text'],
        minMatchCharLength: str.length / 2,
        shouldSort: true,
        threshold: 0.25,
        tokenize: true,
      };
      const fuse = new Fuse(messages, fuseOptions);
      const noUser = {
        color: '#777777',
        deleted: true,
        id: 'UUUUUUUUU',
        is_restricted: true,
        name: 'Unknown User',
        team_id: 'TTTTTTTTT',
      };
      messages = fuse.search(str);
      for (let i = 0; i < messages.length; i += 1) {
        const message = messages[i];
        message.file = file;
        message.team = teamId;
        message.is_selected = false;
        if (message.item.comment) {
          message.item.user = message.item.comment.user;
        }
        message.user_object = this.userMap[message.item.user];
        if (!message.user_object) {
          message.user_object = noUser;
        }
        if (!message.item.user) {
          message.item.user = noUser.id;
        }
        message.user_sent = (user === message.item.user);
        searchResults.push(message);
      }
    });
    this.setState({
      searchResults,
      target: str,
    });
  }

  /**
   * Select the specified message.
   *
   * @param {string} ts The message timestamp
   * @returns {void} Nothing
   * @memberof SearchStore
   */
  onHighlightMessage(ts: string) {
    const messages = this.state.searchResults;
    for (let i = 0; i < messages.length; i += 1) {
      const message = messages[i];
      message.is_selected = message.item.ts === ts;
    }
    this.setState({ searchResults: messages });
  }

  /**
   * Select the specified conversation.
   *
   * @param {string} filePath The conversation path
   * @returns {void} Nothing
   * @memberof SearchStore
   */
  onHighlightThread(filePath: string) {
    const files = this.state.searchFiles;
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      file.is_selected = file.path === filePath;
    }
    this.setState({ searchFiles: files });
  }
}
