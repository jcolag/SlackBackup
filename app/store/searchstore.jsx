import Reflux from 'reflux';
import { ConfigStore } from './configstore';

const fs = require('fs');
const path = require('path');

export const SearchActions = Reflux.createActions({
  updateSearchString: {},
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
  }

  static stringContains(source, target) {
    const sourceLower = source.toLowerCase();
    const targetLower = target.toLowerCase();
    return sourceLower.indexOf(targetLower) >= 0;
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
          } else {
            files.push(fqname);
          }
        });
      }
    });
    this.setState({ searchFiles: files });
  }

  onUpdateSearchString(str: string) {
    if (str.length < 4) {
      this.setState({
        searchResults: [],
        target: '',
      });
      return;
    }

    const searchResults = [];
    this.updateFileList();
    this.state.searchFiles.forEach(file => {
      let messages = JSON.parse(fs.readFileSync(file, 'utf-8'));
      if (Object.prototype.toString.call(messages) !== '[object Array]') {
        return;
      }
      messages = messages.filter(m => SearchStore.stringContains(m.text, str));
      for (let i = 0; i < messages.length; i += 1) {
        messages[i].file = file;
        messages[i].user_object = this.userMap[messages[i].user];
        console.log(`${messages[i].user} => ${this.userMap[messages[i].user]}`);
        searchResults.push(messages[i]);
      }
    });
    this.setState({
      searchResults,
      target: str,
    });
    console.log(this.state.searchResults);
  }
}
