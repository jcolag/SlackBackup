// @flow
import Reflux from 'reflux';

const { app } = require('electron').remote;
const fs = require('fs');
const path = require('path');

const appFolder = app.getPath('userData');
const appLanguage = app.getLocale();
const configFile = '.slackbackuprc.json';
const indentation = 4;

export const ConfigActions = Reflux.createActions({
  addNewToken: {},
  createFolder: {},
  removeToken: {},
  saveConfiguration: {},
  setComparativeSentiment: {},
  setEmptySave: {},
  setFileDaysToSave: {},
  setFolder: {},
  setNonmemberSave: {},
  setToken: {},
  setTokenIndex: {},
  setUseUserColor: {},
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
    let config = {};
    super();
    const filename = path.join(appFolder, configFile);
    const oldConfigFile = path.join(process.mainModule.filename, configFile);
    console.log(appLanguage);
    let oldFile = false;
    if (fs.existsSync(filename)) {
      config = JSON.parse(fs.readFileSync(filename, 'utf-8'));
    } else if (fs.existsSync(oldConfigFile)) {
      config = JSON.parse(fs.readFileSync(filename, 'utf-8'));
      oldFile = true;
    }
    const folder = Object.prototype.hasOwnProperty.call(config, 'folder')
      ? config.folder
      : path.join(app.getPath('documents'), 'SlackBackup');
    let tokens = Object.prototype.hasOwnProperty.call(config, 'tokens')
      ? config.tokens
      : [];
    tokens = tokens.sort((a, b) => {
      if (
        a.name.toLowerCase().replace(/[^a-z]/g, ' ') >
        b.name.toLowerCase().replace(/[^a-z]/g, ' ')
      ) {
        return 1;
      } else {
        return -1;
      }
    });
    this.state = {
      comparativeSentiment: Object.prototype.hasOwnProperty.call(config, 'comparativeSentiment')
        ? config.comparativeSentiment
        : false,
      defaultLanguage: appLanguage,
      emptySave: Object.prototype.hasOwnProperty.call(config, 'emptySave')
        ? config.emptySave
        : false,
      fileDaysToSave: Object.prototype.hasOwnProperty.call(config, 'fileDaysToSave')
        ? config.fileDaysToSave
        : 30,
      folder,
      folderMissing: !fs.existsSync(folder),
      isDirty: oldFile,
      language: Object.prototype.hasOwnProperty.call(config, 'language')
        ? config.language
        : appLanguage,
      useUserColor: Object.prototype.hasOwnProperty.call(config, 'useUserColor')
        ? config.useUserColor
        : false,
      nonmemberSave: Object.prototype.hasOwnProperty.call(config, 'nonmemberSave')
        ? config.nonmemberSave
        : false,
      tokens,
      weightIndirect: 0,
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
  onSetToken(newToken: { name: string, value: string }) {
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

  /**
   * Changes the selected token.
   *
   * @param {number} newIndex The specified token
   * @returns {void} nothing
   * @memberof ConfigStore
   */
  onSetTokenIndex(newIndex: number) {
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
  onAddNewToken(newToken: string) {
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
   * Removes the current token from the list.
   * 
   * @param {string} tokenId 
   */
  onRemoveToken(tokenId: string) {
    const { tokens } = this.state;
    const newTokens = tokens.filter(t => t !== tokenId && t.value !== tokenId);

    this.setState({
      isDirty: true,
      tokens: newTokens,
    });
  }

  /**
     * Sets a new path for the output folder.
     *
     * @param {any} newFolder The updated string for the folder.
     * @returns {null} no return
     * @memberof ConfigStore
     */
  onSetFolder(newFolder: string) {
    if (newFolder === this.state.folder) {
      return;
    }

    this.setState({
      folder: newFolder,
      folderMissing: !fs.existsSync(newFolder),
      isDirty: true,
    });
  }

  /**
   * Creates the save folder.
   *
   * @returns {void} nothing
   * @memberof ConfigStore
   */
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
  onSetEmptySave(newState: boolean) {
    if (newState === this.state.emptySave) {
      return;
    }

    this.setState({
      emptySave: newState,
      isDirty: true,
    });
  }

  /**
   * Changes the number of days before recommending file deletion.
   *
   * @param {number} days Recommended days
   * @returns {void} nothing
   * @memberof ConfigStore
   */
  onSetFileDaysToSave(days: number) {
    if (days === this.state.fileDaysToSave) {
      return;
    }

    this.setState({
      fileDaysToSave: days,
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
  onSetNonmemberSave(newState: boolean) {
    if (newState === this.state.nonmemberSave) {
      return;
    }

    this.setState({
      isDirty: true,
      nonmemberSave: newState,
    });
  }

  /**
   * Changes the type of sentiment analysis.
   *
   * @param {boolean} newState The new state
   * @returns {void} nothing
   * @memberof ConfigStore
   */
  onSetComparativeSentiment(newState: boolean) {
    if (newState === this.state.comparativeSentiment) {
      return;
    }

    this.setState({
      isDirty: true,
      comparativeSentiment: newState,
    });
  }

  /**
   * Changes which color set to use for analysis data points.
   *
   * @param {boolean} newState The new state
   * @returns {void} nothing
   * @memberof ConfigStore
   */
  onSetUseUserColor(newState: boolean) {
    if (newState === this.state.useUserColor) {
      return;
    }

    this.setState({
      isDirty: true,
      useUserColor: newState,
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
      comparativeSentiment: this.state.comparativeSentiment,
      emptySave: this.state.emptySave,
      fileDaysToSave: this.state.fileDaysToSave,
      folder: this.state.folder,
      nonmemberSave: this.state.nonmemberSave,
      tokens: this.state.tokens,
      useUserColor: this.state.useUserColor,
    };
    fs.writeFileSync(filename, JSON.stringify(config, null, indentation));
    this.setState({ isDirty: false });
  }
}
Reflux.initStore(ConfigStore);
