import Reflux from 'reflux';
import Slack from 'slack';
import { ConfigActions, ConfigStore } from './configstore';

const fs = require('fs');
const path = require('path');

const timeout = 50;
const indentation = 4;

export const SlackActions = Reflux.createActions({
  getAll: {},
  getLists: { children: ['completed', 'failed'] },
  resetDownloadState: {},
});
export class SlackStore extends Reflux.Store {
  constructor() {
    super();
    this.state = {
      channels: [],
      groups: [],
      ims: [],
      team: {},
      userMap: {},
      users: [],
      waitingForChannels: false,
      waitingForGroups: false,
      waitingForIms: false,
      waitingForTeam: false,
      waitingForUserMap: false,
      waitingForUsers: false,
    };
    this.listenables = SlackActions;
  }

  onGetLists() {
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

  onResetDownloadState() {
    this.setState({
      listsFailed: null,
      listsLoading: null,
    });
  }

  getTeam() {
    this.setState({ waitingForTeam: true });
    this.slack.team.info()
      .then(this.setTeam.bind(this))
      .catch((error) => console.log(error));
  }

  setTeam(data) {
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
    }
    ConfigActions.setToken({
      name: team.name,
      value: token,
    });
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
  setChannels(data) {
    if (!data.ok) {
      this.setState({ waitingForChannels: false });
      return;
    }

    this.setState({
      channels: data.channels,
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

    this.state.channels.filter((c) => c.is_member || ConfigStore.state.nonmemberSave)
      .forEach((channel) => {
        const channelFile = path
          .join(ConfigStore.state.folder, `channel-${channel.name}.json`);
        const res = SlackStore.retrieveExistingMessages(channelFile);
        this.slack.channels.history({
          channel: channel.id,
          count: 1000,
          oldest: res[1],
        })
          .then(SlackStore.writeHistory.bind(channel, res[0], channelFile))
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
  setIms(data) {
    if (!data.ok) {
      this.setState({ waitingForIms: false });
      return;
    }

    this.setState({
      ims: data.ims,
      waitingForIms: false,
    });
  }

  /**
     * When instant messages are available, iterate through to get histories.
     *
     * @returns {null} No return
     */
  processIms() {
    if (this.state) {
      console.log(this.state.waitingForIms);
    } else {
      console.log('No state');
    }
    if (!this.state || this.state.waitingForIms) {
      setTimeout(this.processIms.bind(this), timeout);
      return;
    }

    this.state.ims.forEach((im) => {
      const user = this.state.userMap[im.user];
      const name = user.real_name ? user.real_name : user.name;
      const imFile = path.join(ConfigStore.state.folder, `im-${name}.json`)
        .replace(' ', '-');
      const res = SlackStore.retrieveExistingMessages(imFile);
      this.slack.im.history({
        channel: im.id,
        count: 1000,
        oldest: res[1],
      })
        .then(SlackStore.writeHistory.bind(im, res[0], imFile))
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
  setGroups(data) {
    if (!data.ok) {
      this.setState({ waitingForGroups: false });
      return;
    }

    this.setState({
      groups: data.groups,
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

    this.state.groups.forEach((group) => {
      const groupFile = path
        .join(ConfigStore.state.folder, `group-${group.name}.json`);
      const res = SlackStore.retrieveExistingMessages(groupFile);
      this.slack.groups.history({
        channel: group.id,
        count: 1000,
        oldest: res[1],
      })
        .then(SlackStore.writeHistory.bind(group, res[0], groupFile))
        .catch((error) => console.log(error));
    });
  }

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
  setUsers(data) {
    if (!data.ok) {
      this.setState({ waitingForUsers: false });
      return;
    }

    this.setState({
      users: data.members,
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
      this.state.userMap[user.id] = user;
      fs.writeFileSync(path
        .join(ConfigStore.state.folder, `user-${name}.json`), json);
    });
    this.setState({ waitingForUserMap: false });
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
  static writeHistory(original, filename, data) {
    if (data.ok) {
      const messages = data.messages
        .concat(original)
        .sort((a, b) => b.ts - a.ts);
      if (messages.length === 0 && !ConfigStore.state.emptySave) {
        return;
      }

      const json = JSON.stringify(messages, null, indentation);
      fs.writeFileSync(filename, json);
    }
  }
}
Reflux.initStore(SlackStore);
