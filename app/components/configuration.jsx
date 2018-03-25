// @flow
import React from 'react';
import Reflux from 'reflux';
import { ConfigActions, ConfigStore } from '../store/configstore';
import { SlackActions, SlackStore } from '../store/slackstore';

const { shell } = require('electron');

type Props = {};

export default class Configuration extends Reflux.Component<Props> {
  props: Props;

  constructor(props: Props) {
    super(props);
    this.stores = [ConfigStore, SlackStore];
    this.state = {
      addingToken: false,
    };
  }

  static updateEmptySave(event: SyntheticMouseEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    ConfigActions.setEmptySave(currentTarget.checked);
  }

  static updateNonmemberSave(event: SyntheticMouseEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    ConfigActions.setNonmemberSave(currentTarget.checked);
  }

  static updateFolder(event: SyntheticInputEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    ConfigActions.setFolder(currentTarget.value);
  }

  static updateToken(event: SyntheticInputEvent<HTMLSelectElement>) {
    const { currentTarget } = event;
    const index = currentTarget.selectedIndex;
    const option = currentTarget.children[index];
    ConfigActions.setTokenIndex(option.value);
  }

  startAddToken() {
    this.setState({ addingToken: true });
  }

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
    this.setState({ addingToken: false });
  }

  static getLists() {
    SlackActions.getLists();
  }

  static createFolder() {
    ConfigActions.createFolder();
  }

  static saveConfig() {
    ConfigActions.saveConfiguration();
  }

  static openSlackLegacyTokenGenerator() {
    shell.openExternal('https://api.slack.com/custom-integrations/legacy-tokens');
  }

  render() {
    const tokenOptions = [<option key="null-token" value={-1} />];
    let count = 0;
    this.state.tokens.forEach(token => {
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
      <div style={{ textAlign: 'left' }} >
        <h1>Configuration</h1>
        <div className="row col-md-12">
          <div className="col-md-3">
            <label htmlFor="tokens">Token</label>
          </div>
          <div className="col-md-7">
            <select
              id="tokens"
              style={{ width: '100%' }}
              onChange={Configuration.updateToken}
            >
              {tokenOptions}
            </select>
          </div>
          <div className="col-md-2">
            <button
              disabled={this.state.addingToken}
              onClick={this.startAddToken.bind(this)}
              style={{ width: '100%' }}
            >
              Add
            </button>
          </div>
        </div>
        <div className="row col-md-12">
          You can find or generate your Legacy Token API key for your Slack teams&nbsp;
          <a
            style={{ fontSize: '1em' }}
            onClick={Configuration.openSlackLegacyTokenGenerator}
          >
            at Slack&rsquo;s legacy token generator
          </a>. You may need to log in as multiple users.
        </div>
        <div
          className="row col-md-12"
          style={this.state.addingToken ? null : { display: 'none' }}
        >
          <div className="col-md-1" />
          <div className="col-md-9" >
            <input
              ref={(i) => { this.tokenField = i; }}
              style={{ width: '100%' }}
              type="text"
            />
          </div>
          <div className="col-md-2">
            <button
              onClick={this.addToken.bind(this)}
              style={{ width: '100%' }}
            >
              Confirm
            </button>
          </div>
        </div>
        <div className="row col-md-12">
          <div className="col-md-3">
            <label htmlFor="folder">Save Folder</label>
          </div>
          <div className="col-md-9">
            <input
              id="folder"
              type="text"
              value={this.state.folder}
              style={{ width: '100%' }}
              onChange={Configuration.updateFolder}
            />
          </div>
        </div>
        <div className="row col-md-12" style={this.state.folderMissing ? null : { display: 'none' }}>
          <div className="col-md-8">
            The folder doesn&rsquo;t appear to exist.
          </div>
          <div className="col-md-4">
            <button
              onClick={Configuration.createFolder}
              style={{ width: '100%' }}
            >
              Create It
            </button>
          </div>
        </div>
        <div className="row col-md-12">
          <div className="col-md-6">
            <label htmlFor="saveempty">Save Empty Conversations&nbsp;
              <input
                id="saveempty"
                type="checkbox"
                checked={this.state.emptySave}
                onChange={Configuration.updateEmptySave}
              />
            </label>
          </div>
          <div className="col-md-6">
            <label htmlFor="savenonmember">Save Unsubscribed Channels&nbsp;
              <input
                id="savenonmember"
                type="checkbox"
                checked={this.state.nonmemberSave}
                onChange={Configuration.updateNonmemberSave}
              />
            </label>
          </div>
        </div>
        <div className="row col-md-12">
          <div className="col-md-6">
            <button
              onClick={Configuration.getLists}
              style={{ width: '100%' }}
              disabled={this.state.whichToken < 0 || this.state.folderMissing}
            >
              List Conversations
            </button>
          </div>
          <div className="col-md-6">
            <button
              onClick={Configuration.saveConfig}
              style={{ width: '100%' }}
              disabled={!this.state.isDirty}
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    );
  }
}
