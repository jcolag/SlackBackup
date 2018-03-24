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
        <div className="row col-md-12" key={`div${item.id}`} style={{ lineHeight: '1em' }} >
          <div className="col-md-1">
            <input
              id={item.id}
              key={item.id}
              type="checkbox"
              checked={!Object.prototype.hasOwnProperty.call(item, 'is_member') || item.is_member}
              onChange={ListSelect.updateCheck}
            />
          </div>
          <div className="col-md-10">
            <label
              key={`label${item.id}`}
              htmlFor={item.id}
            >
              {item.name}
            </label>
          </div>
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
        <div className="col-md-3">
          <button onClick={ListSelect.startDownload} style={{ height: '48%', marginTop: '4%', width: '100%' }} >Download</button>
          <button onClick={ListSelect.abortDownload} style={{ height: '48%', marginTop: '8%', width: '100%' }} >Reset</button>
        </div>
      </div>
    );
  }
}
