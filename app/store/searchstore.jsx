// @flow
import Reflux from 'reflux';
import { ConfigStore } from './configstore';

const fs = require('fs');
const Fuse = require('fuse.js');
const path = require('path');

export const SearchActions = Reflux.createActions({
  highlightMessage: {},
  updateSearchString: { sync: false },
});
export class SearchStore extends Reflux.Store {
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

  updateFileList() {
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
    this.setState({ searchFiles: files });
  }

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
    this.updateFileList();
    this.state.searchFiles.forEach(file => {
      const pathParts = file.split(path.sep);
      const folder = pathParts[pathParts.length - 2];
      const userInfo = this.teams.filter(t => t.folder === folder);
      let messages = JSON.parse(fs.readFileSync(file, 'utf-8'));

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
        message.user_sent = (user === message.item.user);
        searchResults.push(message);
      }
    });
    this.setState({
      searchResults,
      target: str,
    });
  }

  onHighlightMessage(ts: string) {
    const messages = this.state.searchResults;
    for (let i = 0; i < messages.length; i += 1) {
      const message = messages[i];
      message.is_selected = message.item.ts === ts;
    }
  }
}
