// @flow
import Reflux from 'reflux';
import { ConfigStore } from './configstore';

const fs = require('fs');
const moment = require('moment');
const path = require('path');

export const ThreadActions = Reflux.createActions({
  export: { children: ['completed'] },
  loadFile: {},
  toggleSelection: {},
});

export class ThreadStore extends Reflux.Store {
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

  onLoadFile(team: string, filename: string, timestamp: number) {
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

  onToggleSelection(ts: number) {
    const { thread } = this.state;
    for (let i = 0; i < thread.length; i += 1) {
      const message = thread[i];
      if (Number(message.ts) === ts) {
        message.is_selected = !message.is_selected;
      }
    }
    this.setState({ thread });
  }

  onExport() {
    const { thread } = this.state;
    let markdown = `### ${this.teamInfo.team} : ${this.teamInfo.filename}\n\n`;
    for (let i = 0; i < thread.length; i += 1) {
      const message = thread[i];
      if (message.is_selected) {
        const user = this.userMap[message.user];
        const time = moment(message.ts * 1000);
        markdown += ` > ${message.text}\n\n`;
        markdown += `${user.real_name} (${time.format('ll LT')})\n\n`;
      }
    }
    ThreadActions.export.completed(markdown);
  }

  onExportCompleted(text: string) {
    this.setState({ export: text });
  }
}
