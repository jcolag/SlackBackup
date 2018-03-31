import Reflux from 'reflux';

const fs = require('fs');
const path = require('path');

const appFolder = path.dirname(process.mainModule.filename);
const configFile = '.slackbackuprc.json';
const indentation = 4;

export const ConfigActions = Reflux.createActions({
  addNewToken: {},
  createFolder: {},
  saveConfiguration: {},
  setEmptySave: {},
  setFolder: {},
  setNonmemberSave: {},
  setToken: {},
  setTokenIndex: {},
});

/**
 * Exposes configuration information to the program.
 *
 * @export
 * @class ConfigStore
 * @extends {Reflux.Store}
 */
export class ConfigStore extends Reflux.Store {
  /**
     * Creates an instance of ConfigStore.
     * @memberof ConfigStore
     */
  constructor() {
    const filename = path.join(appFolder, configFile);
    let config = {};
    super();
    if (fs.existsSync(filename)) {
      config = JSON.parse(fs.readFileSync(filename, 'utf-8'));
    }
    const folder = Object.prototype.hasOwnProperty.call(config, 'folder')
      ? config.folder
      : 'data';
    this.state = {
      emptySave: Object.prototype.hasOwnProperty.call(config, 'emptySave')
        ? config.emptySave
        : false,
      folder,
      folderMissing: !fs.existsSync(folder),
      isDirty: false,
      nonmemberSave: Object.prototype.hasOwnProperty.call(config, 'nonmemberSave')
        ? config.nonmemberSave
        : false,
      tokens: Object.prototype.hasOwnProperty.call(config, 'tokens')
        ? config.tokens
        : [],
      whichToken: -1,
    };
    this.listenables = ConfigActions;
  }

  /**
     * Sets a new value for the currently-selected token.
     *
     * @param {any} newToken The updated string for the token.
     * @returns {null} no return
     * @memberof ConfigStore
     */
  onSetToken(newToken) {
    if (newToken === this.state.tokens[this.state.whichToken]) {
      return;
    }

    const { tokens } = this.state;
    tokens[this.state.whichToken] = newToken;
    this.setState({
      isDirty: true,
      tokens,
    });
  }

  onSetTokenIndex(newIndex) {
    if (newIndex === this.state.whichToken) {
      return;
    }

    this.setState({
      whichToken: newIndex,
    });
  }

  /**
   * Adds a new token to the list.
   *
   * @param {string} newToken The new Slack legacy token
   * @returns {null} no return
   * @memberof ConfigStore
   */
  onAddNewToken(newToken) {
    const { tokens } = this.state;
    if (tokens.indexOf(newToken) >= 0) {
      return;
    }

    tokens.push(newToken);
    this.setState({
      isDirty: true,
      tokens,
    });
  }

  /**
     * Sets a new path for the output folder.
     *
     * @param {any} newFolder The updated string for the folder.
     * @returns {null} no return
     * @memberof ConfigStore
     */
  onSetFolder(newFolder) {
    if (newFolder === this.state.folder) {
      return;
    }

    this.setState({
      folder: newFolder,
      folderMissing: !fs.existsSync(newFolder),
      isDirty: true,
    });
  }

  onCreateFolder() {
    if (!this.state.folder || this.state.folder === '') {
      return;
    }

    try {
      fs.mkdirSync(this.state.folder);
      this.setState({ folderMissing: false });
    } catch (error) {
      console.log(error);
    }
  }

  /**
     * Sets a new state for whether to save empty conversations.
     *
     * @param {bool} newState The updated boolean.
     * @returns {null} no return
     * @memberof ConfigStore
     */
  onSetEmptySave(newState) {
    if (newState === this.state.emptySave) {
      return;
    }

    this.setState({
      emptySave: newState,
      isDirty: true,
    });
  }

  /**
     * Sets a new state for whether to save channels the user isn't a member of.
     *
     * @param {any} newState The updated boolean.
     * @returns {null} no return
     * @memberof ConfigStore
     */
  onSetNonmemberSave(newState) {
    if (newState === this.state.nonmemberSave) {
      return;
    }

    this.setState({
      isDirty: true,
      nonmemberSave: newState,
    });
  }

  /**
     * Saves the current configuration.
     *
     * @returns {null} no return
     * @memberof ConfigStore
     */
  onSaveConfiguration() {
    const filename = path.join(appFolder, configFile);
    const config = {
      emptySave: this.state.emptySave,
      folder: this.state.folder,
      nonmemberSave: this.state.nonmemberSave,
      tokens: this.state.tokens,
    };
    fs.writeFileSync(filename, JSON.stringify(config, null, indentation));
    this.setState({ isDirty: false });
  }
}
Reflux.initStore(ConfigStore);
