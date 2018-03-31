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
            >
              Add
            </button>
          </div>
        </div>
        <div
          className="row col-md-12"
          style={this.state.addingToken ? null : { display: 'none' }}
        >
          <div className="row col-md-12" style={{ margin: '0.5em 0 0.5em 0' }}>
            <div className="col-md-1" />
            <div className="col-md-10 form-control alert-primary">
              You can find or generate your Legacy Token API key for your Slack teams&nbsp;
              <a
                className="alert-link"
                style={{ fontSize: '1em' }}
                onClick={Configuration.openSlackLegacyTokenGenerator}
              >
                at Slack&rsquo;s legacy token generator
              </a>. You may need to log in as multiple users.
            </div>
            <div className="col-md-1" />
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
        <div className="row col-md-12" style={this.state.folderMissing ? { marginBottom: '1em' } : { display: 'none' }}>
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
                </div>
                <div className="col-md-9">
                  Create It
                </div>
              </div>
            </button>
          </div>
          <div className="col-md-1" />
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
              <label htmlFor="saveempty" className="custom-control-label">
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
              <label htmlFor="savenonmember" className="custom-control-label">
                Save Unsubscribed Channels
              </label>
            </div>
          </div>
        </div>
        <div className="row col-md-12">
          <div className="col-md-6">
            <button
              className="btn btn-primary"
              onClick={Configuration.getLists}
              style={{ width: '100%' }}
              disabled={this.state.whichToken < 0 || this.state.folderMissing}
            >
              List Conversations
            </button>
          </div>
          <div className="col-md-6">
            <button
              className="btn btn-primary"
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
