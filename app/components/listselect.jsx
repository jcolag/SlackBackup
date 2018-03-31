// @flow
import React from 'react';
import Reflux from 'reflux';
import { SlackActions, SlackStore } from '../store/slackstore';

type Props = {};

export default class ListSelect extends Reflux.Component<Props> {
  props: Props;

  constructor(props: Props) {
    super(props);
    this.stores = [SlackStore];
  }

  static updateCheck(event: SyntheticMouseEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    console.log(currentTarget);
  }

  static startDownload() {
    SlackActions.getAll();
  }

  static abortDownload() {
    SlackActions.resetDownloadState();
  }

  static createCheckboxes(list: Array<Object>) {
    const items = [];
    list.forEach(item => {
      items.push(
        <div
          className="row col-md-12 custom-control custom-checkbox"
          key={`div${item.id}`}
          style={{ lineHeight: '1em', left: '0.25em' }}
        >
          <input
            checked={item.shouldDownload}
            className="custom-control-input"
            id={item.id}
            key={item.id}
            onChange={ListSelect.updateCheck}
            type="checkbox"
          />
          <label
            className="custom-control-label form-control alert-primary"
            htmlFor={item.id}
            key={`label${item.id}`}
          >
            {item.profile && item.profile.real_name ? item.profile.real_name : item.name}
          </label>
        </div>);
    });
    return items;
  }

  render() {
    const channels = ListSelect.createCheckboxes(this.state.channels);
    const groups = ListSelect.createCheckboxes(this.state.groups);
    const users = ListSelect.createCheckboxes(this.state.users);
    return (
      <div className="row col-md-12" style={{ height: '100vh', textAlign: 'left' }}>
        <div className="col-md-9">
          <h1>{this.state.team.name}</h1>
          <div className="col-md-12" style={{ height: 'calc(100% - 4em)', overflowY: 'scroll' }}>
            <h3>Channels</h3>
            {channels}
            <h3>Groups</h3>
            {groups}
            <h3>Users</h3>
            {users}
          </div>
        </div>
        <div className="col-md-4">
          <button
            onClick={ListSelect.startDownload}
            className="btn btn-primary"
            style={{ height: '26%', marginTop: '4%', width: '100%' }}
          >
            <div className="row col-md-12">
                Download
            </div>
          </button>
          <button
            onClick={ListSelect.abortDownload}
            className="btn btn-warning"
            style={{ height: '26%', marginTop: '7%', width: '100%' }}
          >
            <div className="row col-md-12">
                Delete Files
            </div>
          </button>
        </div>
      </div>
    );
  }
}
