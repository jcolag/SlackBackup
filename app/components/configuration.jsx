// @flow
import React from 'react';
import Reflux from 'reflux';
import { Localized } from 'fluent-react/compat';
import { ConfigActions, ConfigStore } from '../store/configstore';
import { SlackActions, SlackStore } from '../store/slackstore';

const { shell } = require('electron');

type Props = {};

/**
 * The configuration screen.
 *
 * @export
 * @class Configuration
 * @extends {Reflux.Component<Props>}
 */
export default class Configuration extends Reflux.Component<Props> {
  props: Props;

  /**
   * Creates an instance of Configuration.
   * @param {Props} props Component properties
   * @memberof Configuration
   */
  constructor(props: Props) {
    super(props);
    this.legacyUrl = 'https://api.slack.com/custom-integrations/legacy-tokens';
    this.stores = [ConfigStore, SlackStore];
    this.state = {
      addingToken: false,
      newTokenLength: 0,
    };
  }

  /**
   * Change the save-empty configuration option.
   *
   * @static
   * @param {SyntheticMouseEvent<HTMLInputElement>} event Click event
   * @returns {void} Nothing
   * @memberof Configuration
   */
  static updateEmptySave(event: SyntheticMouseEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    ConfigActions.setEmptySave(currentTarget.checked);
  }

  /**
   * Change the save-unused configuration option.
   *
   * @static
   * @param {SyntheticMouseEvent<HTMLInputElement>} event Click event
   * @returns {void} Nothing
   * @memberof Configuration
   */
  static updateNonmemberSave(event: SyntheticMouseEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    ConfigActions.setNonmemberSave(currentTarget.checked);
  }

  /**
   * Change the type of sentiment analysis.
   *
   * @static
   * @param {SyntheticMouseEvent<HTMLInputElement>} event Click event
   * @returns {void} Nothing
   * @memberof Configuration
   */
  static updateComparativeSentiment(event: SyntheticMouseEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    ConfigActions.setComparativeSentiment(currentTarget.checked);
  }

  /**
   * Change the target folder path.
   *
   * @static
   * @param {SyntheticInputEvent<HTMLInputElement>} event Input event
   * @returns {void} Nothing
   * @memberof Configuration
   */
  static updateFolder(event: SyntheticInputEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    ConfigActions.setFolder(currentTarget.value);
  }

  /**
   * Change the analysis color setting.
   *
   * @static
   * @param {SyntheticInputEvent<HTMLInputElement>} event Input event
   * @returns {void} Nothing
   * @memberof Configuration
   */
  static updateUseUserColor(event: SyntheticMouseEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    ConfigActions.setUseUserColor(currentTarget.checked);
  }

  /**
   * Change the number of days of files before recommending deletion.
   *
   * @static
   * @param {SyntheticInputEvent<HTMLInputElement>} event Input event
   * @returns {void} Nothing
   * @memberof Configuration
   */
  static updateDays(event: SyntheticInputEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    ConfigActions.setFileDaysToSave(Number(currentTarget.value));
  }

  /**
   * Update token information.
   *
   * @static
   * @param {SyntheticInputEvent<HTMLSelectElement>} event Input event
   * @returns {void} Nothing
   * @memberof Configuration
   */
  static updateToken(event: SyntheticInputEvent<HTMLSelectElement>) {
    const { currentTarget } = event;
    const index = currentTarget.selectedIndex;
    const option = currentTarget.children[index];
    ConfigActions.setTokenIndex(Number(option.value));
  }

  /**
   * Set tokens as being in-process.
   *
   * @returns {void} Nothing
   * @memberof Configuration
   */
  startAddToken() {
    this.setState({ addingToken: true });
  }

  /**
   * Add the new token.
   *
   * @returns {void} Nothing
   * @memberof Configuration
   */
  addToken() {
    if (!this.tokenField) {
      return;
    }

    const token = this.tokenField.value;
    if (!token || token === '') {
      return;
    }

    ConfigActions.addNewToken(token);
    this.tokenField.value = '';
    this.setState({
      addingToken: false,
      newTokenLength: 0,
    });
  }

  /**
   * Flag typed token as updated.
   *
   * @returns {void} Nothing
   * @memberof Configuration
   */
  handleTokenUpdated() {
    const newTokenLength = this.tokenField.value.length;
    this.setState({ newTokenLength });
  }

  /**
   * Start process of getting Slack information.
   *
   * @static
   * @returns {void} Nothing
   * @memberof Configuration
   */
  static getLists() {
    SlackActions.getLists();
  }

  /**
   * Create the target folder.
   *
   * @static
   * @returns {void} Nothing
   * @memberof Configuration
   */
  static createFolder() {
    ConfigActions.createFolder();
  }

  /**
   * Save current configuration information.
   *
   * @static
   * @returns {void} Nothing
   * @memberof Configuration
   */
  static saveConfig() {
    ConfigActions.saveConfiguration();
  }

  /**
   * Have a browser point to Slack's legacy token page.
   *
   * @returns {void} Nothing
   * @memberof Configuration
   */
  openSlackLegacyTokenGenerator() {
    shell.openExternal(this.legacyUrl);
  }

  /**
   * Render the component.
   *
   * @returns {{}} the component
   * @memberof Configuration
   */
  render() {
    const tokenOptions = [<option key="null-token" value={-1} />];
    let count = 0;
    this.state.tokens.sort((a, b) => a.name > b.name).forEach(token => {
      let text = '';
      if (typeof token === 'string') {
        text = token;
      } else {
        text = `(${token.name}) ${token.value}`;
      }
      tokenOptions.push(<option key={`${count}-token`} value={count}>{text}</option>);
      count += 1;
    });
    return (
      <div style={{ height: '100vh', textAlign: 'left' }} >
        <h1><i className="fa fa-slack" /> Configuration</h1>
        <div className="row col-md-12">
          <div className="col-md-3">
            <label htmlFor="tokens" className="form-control">Token</label>
          </div>
          <div className="col-md-7">
            <select
              className="custom-select"
              id="tokens"
              style={{ width: '100%' }}
              onChange={Configuration.updateToken}
              value={this.state.whichToken}
            >
              {tokenOptions}
            </select>
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-secondary"
              disabled={this.state.addingToken}
              onClick={this.startAddToken.bind(this)}
              style={{ width: '100%' }}
              title="Add a new Slack legacy token"
            >
              <i className="fa fa-plus-square" />
              &nbsp;Add
            </button>
          </div>
        </div>
        <div
          className="row col-md-12 expander"
          style={{ height: this.state.addingToken ? '156px' : 0, overflow: 'hidden' }}
        >
          <div className="row col-md-12" style={{ margin: '0.5em 0 0.5em 0' }}>
            <div className="col-md-1" />
            <div className="col-md-10 form-control alert-primary">
              You can find or generate your Legacy Token API key for your Slack teams&nbsp;
              <a
                className="alert-link"
                draggable={false}
                style={{ fontSize: '1em' }}
                onClick={this.openSlackLegacyTokenGenerator.bind(this)}
                onKeyPress={this.openSlackLegacyTokenGenerator.bind(this)}
                role="link"
                tabIndex={0}
                title={this.legacyUrl}
              >
                at Slack&rsquo;s legacy token generator
              </a>. You may need to log in as multiple users to see all teams.
            </div>
            <div className="col-md-1" />
          </div>
          <div className="col-md-12 row" style={{ marginBottom: '1em' }}>
            <div className="col-md-1" />
            <div className="col-md-8" >
              <input
                className="form-control"
                onChange={this.handleTokenUpdated.bind(this)}
                ref={(i) => { this.tokenField = i; }}
                style={{ width: '100%' }}
                type="text"
              />
            </div>
            <div className="col-md-3">
              <button
                disabled={this.state.newTokenLength < 50}
                className="btn btn-info"
                onClick={this.addToken.bind(this)}
                style={{ width: '100%' }}
              >
                <div className="row col-md-12" style={{ left: '1em', paddingLeft: 0 }}>
                  <div className="col-md-2" style={{ padding: 0 }}>
                    <i className="fa fa-check-circle" />
                  </div>
                  <div className="col-md-10">
                    Confirm
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
        <div
          className="row col-md-12"
          title="Set the destination folder to archive conversations"
        >
          <div className="col-md-3">
            <label htmlFor="folder" className="form-control">Save Folder</label>
          </div>
          <div className="col-md-9">
            <input
              className="form-control"
              id="folder"
              type="text"
              value={this.state.folder}
              style={{ width: '100%' }}
              onChange={Configuration.updateFolder}
            />
          </div>
        </div>
        <div
          className="row col-md-12 expander"
          style={
              this.state.folderMissing ?
                {
                  height: '40px',
                  marginBottom: '1em',
                  overflow: 'hidden',
                  paddingTop: '1px'
                } :
                {
                  height: 0,
                  overflow: 'hidden',
                  paddingTop: '1px'
                }
              }
        >
          <div className="col-md-1" />
          <div className="col-md-6 form-control alert-warning">
            The folder doesn&rsquo;t appear to exist.
          </div>
          <div className="col-md-4">
            <button
              className="btn btn-info"
              onClick={Configuration.createFolder}
              style={{ width: '100%' }}
            >
              <div className="row col-md-12">
                <div className="col-md-3" style={{ padding: 0 }}>
                  <i className="fa fa-folder-open" />
                </div>
                <div className="col-md-9">
                  Create It
                </div>
              </div>
            </button>
          </div>
          <div className="col-md-1" />
        </div>
        <div className="row col-md-12" title="The minimum age of files to save, by default">
          <div className="col-md-3">
            <label htmlFor="days" className="form-control">Delete Files</label>
          </div>
          <div className="col-md-4">
            <input
              className="form-control"
              id="days"
              onChange={Configuration.updateDays}
              type="number"
              value={this.state.fileDaysToSave}
            />
          </div>
          <div className="col-md-5">
            <span className="form-control">
              days older or more
            </span>
          </div>
        </div>
        <div className="row col-md-12">
          <div className="col-md-6">
            <div className="custom-control custom-checkbox form-control">
              <input
                className="custom-control-input"
                id="saveempty"
                type="checkbox"
                checked={this.state.emptySave}
                onChange={Configuration.updateEmptySave}
              />
              <label htmlFor="saveempty" className="custom-control-label checkbox-label">
                Save Empty Conversations
              </label>
            </div>
          </div>
          <div className="col-md-6">
            <div className="custom-control custom-checkbox form-control">
              <input
                className="custom-control-input"
                id="savenonmember"
                type="checkbox"
                checked={this.state.nonmemberSave}
                onChange={Configuration.updateNonmemberSave}
              />
              <label htmlFor="savenonmember" className="custom-control-label checkbox-label">
                Save Unsubscribed Channels
              </label>
            </div>
          </div>
        </div>
        <div className="row col-md-12" style={{ marginTop: '0.5em' }}>
          <div
            className="col-md-6"
            title="When performing sentiment analysis, Comparative takes the lengths of posts into account"
          >
            <div className="custom-control custom-checkbox form-control">
              <input
                className="custom-control-input"
                id="comparesentiment"
                type="checkbox"
                checked={this.state.comparativeSentiment}
                onChange={Configuration.updateComparativeSentiment}
              />
              <label htmlFor="comparesentiment" className="custom-control-label checkbox-label">
                Use Comparative Sentiment
              </label>
            </div>
          </div>
          <div
            className="col-md-6"
            title="For data points in analysis, use the message recipients' colors (for direct messages), rather than this user's color"
          >
            <div className="custom-control custom-checkbox form-control">
              <input
                className="custom-control-input"
                id="useusercolor"
                type="checkbox"
                checked={this.state.useUserColor}
                onChange={Configuration.updateUseUserColor}
              />
              <label htmlFor="useusercolor" className="custom-control-label checkbox-label">
                Use Recipient Users&rsquo; Colors
              </label>
            </div>
          </div>
        </div>
        <div className="row col-md-12" style={{ marginTop: '0.5em' }} >
          <div className="col-md-6">
            <button
              className="btn btn-primary"
              onClick={Configuration.getLists}
              style={{ width: '100%' }}
              disabled={this.state.whichToken < 0 || this.state.folderMissing}
            >
              <div className="row col-md-12">
                <div className="col-md-3">
                  <i className="fa fa-th-list" />
                </div>
                <div className="col-md-9">
                  List Conversations
                </div>
              </div>
            </button>
          </div>
          <div className="col-md-6">
            <button
              className="btn btn-primary"
              onClick={Configuration.saveConfig}
              style={{ width: '100%' }}
              disabled={!this.state.isDirty}
            >
              <div className="row col-md-12">
                <div className="col-md-3">
                  <i className="fa fa-user-circle" />
                </div>
                <div className="col-md-9">
                  Save Configuration
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
