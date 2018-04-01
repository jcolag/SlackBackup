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
    this.legacyUrl = 'https://api.slack.com/custom-integrations/legacy-tokens';
    this.stores = [ConfigStore, SlackStore];
    this.state = {
      addingToken: false,
      newTokenLength: 0,
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
    this.setState({
      addingToken: false,
      newTokenLength: 0,
    });
  }

  handleTokenUpdated() {
    const newTokenLength = this.tokenField.value.length;
    console.log(newTokenLength);
    this.setState({ newTokenLength });
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
    shell.openExternal(this.legacyUrl);
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
                style={{ fontSize: '1em' }}
                onClick={Configuration.openSlackLegacyTokenGenerator}
                title={this.legacyUrl}
              >
                at Slack&rsquo;s legacy token generator
              </a>. You may need to log in as multiple users.
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
                <div className="row col-md-12">
                  <div className="col-md-3" style={{ padding: 0 }}>
                    <i className="fa fa-check-circle" />
                  </div>
                  <div className="col-md-9">
                    Confirm
                  </div>
                </div>
              </button>
            </div>
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
