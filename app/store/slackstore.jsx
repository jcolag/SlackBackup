// @flow
import Reflux from 'reflux';
import Slack from 'slack';
import { ConfigActions, ConfigStore } from './configstore';

const fs = require('fs');
const path = require('path');

const timeout = 50;
const indentation = 4;
const oneDay = 86400000;

export const SlackActions = Reflux.createActions({
  deleteFiles: { children: ['completed', 'failed'] },
  getAll: {},
  getLists: { children: ['completed', 'failed'] },
  listFiles: { children: ['completed', 'failed'] },
  resetDownloadState: {},
  toggleSelected: {},
});
export class SlackStore extends Reflux.Store {
  constructor() {
    super();
    this.state = {
      channels: [],
      fileListLoading: false,
      files: [],
      filesLoading: false,
      groups: [],
      ims: [],
      listsLoading: false,
      listsFailed: false,
      team: {},
      unreadMessages: 0,
      user: {},
      userMap: {},
      users: [],
      waitingForChannels: false,
      waitingForFiles: false,
      waitingForGroups: false,
      waitingForIms: false,
      waitingForTeam: false,
      waitingForUser: false,
      waitingForUserMap: false,
      waitingForUsers: false,
    };
    this.listenables = SlackActions;
    this.teamName = 'unknown_team';
  }

  onGetLists() {
    this.setState({ unreadMessages: 0 });
    if (ConfigStore.state.whichToken < 0) {
      SlackActions.getLists.failed();
      return;
    }

    let token = ConfigStore.state.tokens[ConfigStore.state.whichToken];
    if (typeof token !== 'string') {
      token = token.value;
    }
    this.slack = new Slack({
      token,
    });
    this.getCurrentUser();
    this.getTeam();
    this.getUsers();
    this.getChannels();
    this.getGroups();
    SlackActions.getLists.completed();
  }

  onGetListsFailed() {
    this.setState({
      listsFailed: true,
      listsLoading: false,
    });
  }

  onGetListsCompleted() {
    this.setState({
      listsFailed: false,
      listsLoading: true,
    });
  }

  onGetAll() {
    this.processUsers();
    this.processChannels();
    this.processGroups();
    this.getIms();
  }

  /**
   * Reset download information.
   *
   * @memberof SlackStore
   */
  onResetDownloadState() {
    this.setState({
      listsFailed: null,
      listsLoading: null,
    });
  }

  /**
   * Retrieve user information.
   *
   * @memberof SlackStore
   */
  getCurrentUser() {
    this.setState({ waitingForUser: true });
    this.slack.auth.test()
      .then(this.setCurrentUser.bind(this))
      .catch((error) => console.log(error));
  }

  /**
   * Store user information.
   *
   * @param {any} data
   * @returns
   * @memberof SlackStore
   */
  setCurrentUser(data: { ok: boolean }) {
    if (!data.ok) {
      console.log('Error retrieving user information.');
      return;
    }

    this.setState({
      user: data,
      waitingForUser: false,
    });
    setTimeout(this.saveUserInformation.bind(this), 0, data);
  }

  /**
   * Save object representing current user.
   *
   * @param {any} data User object
   * @returns {null} Nothing
   * @memberof SlackStore
   */
  saveUserInformation(data: {}) {
    if (this.state.waitingForTeam) {
      setTimeout(this.saveUserInformation.bind(this), 250, data);
      return;
    }

    const fqfile = path.join(ConfigStore.state.folder, this.teamName, '_localuser.json');
    const json = JSON.stringify(data, null, indentation);
    fs.writeFileSync(fqfile, json);
  }

  /**
   * Retrieve team information.
   *
   * @memberof SlackStore
   */
  getTeam() {
    this.setState({ waitingForTeam: true });
    this.slack.team.info()
      .then(this.setTeam.bind(this))
      .catch((error) => console.log(error));
  }

  /**
   * Store team information.
   *
   * @memberof SlackStore
   */
  setTeam(data: { ok: boolean, team: { name: string } }) {
    if (!data.ok) {
      console.log('Error retrieving Team information.');
      return;
    }

    const { team } = data;
    let token = ConfigStore.state.tokens[ConfigStore.state.whichToken];
    this.setState({
      team,
      waitingForTeam: false,
    });
    if (typeof token !== 'string') {
      token = token.value;
    } else {
      ConfigActions.setToken({
        name: team.name,
        value: token,
      });
    }
    this.teamName = team.name.toLowerCase().replace(/[^0-9a-z]/, '_');
  }

  /**
   * Start process of retrieving channels.
   *
   * @memberof SlackStore
   */
  getChannels() {
    this.setState({ waitingForChannels: true });
    this.slack.channels.list()
      .then(this.setChannels.bind(this))
      .catch((error) => console.log(error));
  }

  /**
     * Store channel data when ready.
     *
     * @param {any} data Channels received from Slack.
     * @returns {null} no return
     */
  setChannels(data: { channels: { length: number }, ok: boolean }) {
    if (!data.ok) {
      this.setState({ waitingForChannels: false });
      return;
    }

    const { channels } = data;
    for (let i = 0; i < channels.length; i += 1) {
      channels[i].shouldDownload = ConfigStore.state.nonmemberSave || channels[i].is_member;
    }

    this.setState({
      channels,
      waitingForChannels: false,
    });
  }

  /**
     * When channels are available, iterate through to get histories.
     *
     * @returns {null} No return
     */
  processChannels() {
    if (this.state.waitingForChannels) {
      setTimeout(this.processChannels, timeout);
      return;
    }

    this.state.channels.filter((c) => c.shouldDownload)
      .forEach((channel) => {
        const channelFile = path
          .join(ConfigStore.state.folder, this.teamName, `channel-${channel.name}.json`);
        const res = SlackStore.retrieveExistingMessages(channelFile);
        this.slack.channels.history({
          channel: channel.id,
          count: 1000,
          oldest: res[1],
          unreads: true,
        })
          .then(this.writeHistory.bind(this, channel, res[0], channelFile))
          .catch((error) => console.log(error));
      });
  }

  /**
     * Start instant message process.
     *
     * @returns {null} No return
     */
  getIms() {
    if (!this.state || this.state.waitingForUserMap) {
      setTimeout(this.getIms, timeout);
      return;
    }

    this.setState({ waitingForIms: true });
    this.slack.im.list()
      .then(this.setIms.bind(this))
      .catch((error) => console.log(error));
    setTimeout(this.processIms.bind(this), 0);
  }

  /**
     * Store instant message data when ready.
     *
     * @param {any} data Messages returned from Slack.
     * @returns {null} No return
     */
  setIms(data: { ims: { length: number }, ok: boolean }) {
    if (!data.ok) {
      this.setState({ waitingForIms: false });
      return;
    }

    const { ims } = data;
    for (let i = 0; i < ims.length; i += 1) {
      ims[i].shouldDownload = this.state.userMap[ims[i].user].shouldDownload;
    }

    this.setState({
      ims,
      waitingForIms: false,
    });
  }

  /**
     * When instant messages are available, iterate through to get histories.
     *
     * @returns {null} No return
     */
  processIms() {
    if (!this.state || this.state.waitingForIms) {
      setTimeout(this.processIms.bind(this), timeout);
      return;
    }

    this.state.ims.filter(im => im.shouldDownload).forEach((im) => {
      const user = this.state.userMap[im.user];
      const name = user.real_name ? user.real_name : user.name;
      const imFile = path.join(ConfigStore.state.folder, this.teamName, `im-${name}.json`)
        .replace(' ', '-');
      const res = SlackStore.retrieveExistingMessages(imFile);
      this.slack.im.history({
        channel: im.id,
        count: 1000,
        oldest: res[1],
        unreads: true,
      })
        .then(this.writeHistory.bind(this, im, res[0], imFile))
        .catch((error) => console.log(error));
    });
  }

  /**
   * Retrieve group information.
   *
   * @memberof SlackStore
   */
  getGroups() {
    this.setState({ waitingForGroups: true });
    this.slack.groups.list()
      .then(this.setGroups.bind(this))
      .catch((error) => console.log(error));
  }

  /**
     * Store group data when ready.
     *
     * @param {any} data Groups returned from Slack.
     * @returns {null} No return
     */
  setGroups(data: { groups: { length: number }, ok: boolean }) {
    if (!data.ok) {
      this.setState({ waitingForGroups: false });
      return;
    }

    const { groups } = data;
    for (let i = 0; i < groups.length; i += 1) {
      groups[i].shouldDownload = true;
    }

    this.setState({
      groups,
      waitingForGroups: false,
    });
  }

  /**
     * When groups are available, iterate through to get histories.
     *
     * @returns {null} No return
     */
  processGroups() {
    if (this.state.waitingForGroups) {
      setTimeout(this.processGroups, timeout);
      return;
    }

    this.state.groups.filter(g => g.shouldDownload).forEach((group) => {
      const groupFile = path
        .join(ConfigStore.state.folder, this.teamName, `group-${group.name}.json`);
      const res = SlackStore.retrieveExistingMessages(groupFile);
      this.slack.groups.history({
        channel: group.id,
        count: 1000,
        oldest: res[1],
        unreads: true,
      })
        .then(this.writeHistory.bind(this, group, res[0], groupFile))
        .catch((error) => console.log(error));
    });
  }

  /**
   * Retrieve user information.
   *
   * @memberof SlackStore
   */
  getUsers() {
    this.setState({
      waitingForUserMap: true,
      waitingForUsers: true,
    });
    this.slack.users.list()
      .then(this.setUsers.bind(this))
      .catch((error) => console.log(error));
  }
  /**
     * Store user data when ready.
     *
     * @param {any} data User data returned from Slack.
     * @returns {null} No return
     */
  setUsers(data: { members: { length: number }, ok: boolean }) {
    if (!data.ok) {
      this.setState({ waitingForUsers: false });
      return;
    }

    const users = data.members;
    for (let i = 0; i < users.length; i += 1) {
      users[i].shouldDownload = !users[i].deleted;
    }

    this.setState({
      users,
      waitingForUsers: false,
    });
  }

  /**
     * When users are available, iterate through to get and save details.
     *
     * @returns {null} No return
     */
  processUsers() {
    if (this.state.waitingForUsers) {
      setTimeout(this.processUsers, timeout);
      return;
    }

    this.state.users.forEach((user) => {
      const json = JSON.stringify(user, null, indentation);
      let name = user.real_name ? user.real_name : user.name;
      name = name.replace(' ', '-');
      if (!user.deleted) {
        this.state.userMap[user.id] = user;
      }
      const filename = path.join(ConfigStore.state.folder, this.teamName, `user-${name}.json`);
      if (fs.existsSync(filename) || user.deleted) {
        return;
      }
      fs.writeFileSync(filename, json);
    });
    this.setState({ waitingForUserMap: false });
  }

  /**
   * Get files associated with account.
   *
   * @memberof SlackStore
   */
  onListFiles() {
    if (this.state.waitingForUser) {
      setTimeout(SlackActions.listFiles, 100);
      return;
    }

    this.setState({
      waitingForFiles: true,
    });
    this.slack.files.list({
      count: 10000,
      user: this.state.user.user_id,
    })
      .then(this.setFiles.bind(this))
      .catch((error) => {
        console.log(error);
        SlackActions.listFiles.failed();
      });
  }

  /**
   * Store file information when ready.
   *
   * @param {any} data File data returned from Slack.
   * @returns {null} No return
   * @memberof SlackStore
   */
  setFiles(data: { files: { length: number }, ok: boolean }) {
    if (!data.ok) {
      this.setState({ waitingForFiles: false });
      SlackActions.listFiles.failed();
      return;
    }

    const { files } = data;
    const thirtyDaysAgo = (+new Date() - (oneDay * ConfigStore.state.fileDaysToSave)) / 1000;
    for (let i = 0; i < files.length; i += 1) {
      files[i].shouldDelete = files[i].created <= thirtyDaysAgo
        && (files[i].pinned_to === undefined || files[i].pinned_to.length === 0);
    }

    this.setState({
      files,
      waitingForFiles: false,
    });
    SlackActions.listFiles.completed();
  }

  /**
   * Iterate through the file list to instruct Slack to delete those set.
   *
   * @returns {null} No return
   * @memberof SlackStore
   */
  onDeleteFiles() {
    if (this.state.waitingForFiles) {
      setTimeout(this.onDeleteFiles, timeout);
      return;
    }

    this.state.files.forEach(file => {
      if (file.shouldDelete) {
        this.slack.files.delete({
          file: file.id,
        })
          .then(this.removeFileFromList.bind(this, file))
          .catch((error) => {
            console.log(error);
            SlackActions.deleteFiles.failed();
          });
      }
    });
    SlackActions.deleteFiles.completed();
  }

  /**
   * Remove a file object from the files list.
   *
   * @param {any} file The file object
   * @memberof SlackStore
   */
  removeFileFromList(file: string) {
    const { files } = this.state;
    const index = files.indexOf(file);
    files.splice(index, 1);
    this.setState({ files });
  }

  /**
   * Turn download of individual items on or off.
   *
   * @param {any} id The Slack object ID
   * @memberof SlackStore
   */
  onToggleSelected(id: string) {
    let found = false;
    const {
      channels, files, groups, users
    } = this.state;
    for (let i = 0; i < channels.length; i += 1) {
      if (channels[i].id === id) {
        channels[i].shouldDownload = !channels[i].shouldDownload;
        found = true;
      }
    }
    for (let i = 0; i < groups.length; i += 1) {
      if (groups[i].id === id) {
        groups[i].shouldDownload = !groups[i].shouldDownload;
        found = true;
      }
    }
    for (let i = 0; i < users.length; i += 1) {
      if (users[i].id === id) {
        users[i].shouldDownload = !users[i].shouldDownload;
        found = true;
      }
    }
    for (let i = 0; i < files.length; i += 1) {
      if (files[i].id === id) {
        files[i].shouldDelete = !files[i].shouldDelete;
        found = true;
      }
    }
    if (found) {
      this.setState({
        channels,
        files,
        groups,
        users,
      });
    }
  }

  /**
     * Extract existing messages and find most recent timestamp.
     *
     * @param {any} filePath Path where existing downloads have been stored
     * @returns {array} Messages and most recent timestamp
     */
  static retrieveExistingMessages(filePath) {
    let messages = [];
    let lastTime = 0;
    if (fs.existsSync(filePath)) {
      messages = JSON.parse(fs.readFileSync(filePath), 'utf-8');
      if (messages.length > 0) {
        const msg = messages
          .reduce((max, p) => (p.ts > max ? p.ts : max));
        lastTime = msg.ts;
      }
    }

    return [
      messages,
      lastTime,
    ];
  }

  /**
     * Add recent messages to those already saved.
     *
     * @param {any} original Existing messages
     * @param {any} filename Target file
     * @param {any} data Data retrieved from Slack
     * @returns {null} No return
     */
  writeHistory(store, original, filename, data) {
    if (data.ok) {
      const messages = data.messages
        .concat(original)
        .sort((a, b) => b.ts - a.ts);
      if (messages.length === 0 && !ConfigStore.state.emptySave) {
        return;
      }

      const json = JSON.stringify(messages, null, indentation);
      fs.writeFileSync(filename, json);
      if (data.unread_count_display) {
        this.setState({ unreadMessages: this.state.unreadMessages + data.unread_count_display });
      }
    }
  }
}
Reflux.initStore(SlackStore);
