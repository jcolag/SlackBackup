// @flow
import React from 'react';
import Reflux from 'reflux';
import { SlackActions, SlackStore } from '../store/slackstore';
import { UiActions } from '../store/uistore';

type Props = {};

export default class ListSelect extends Reflux.Component<Props> {
  props: Props;

  constructor(props: Props) {
    super(props);
    this.stores = [SlackStore];
  }

  componentDidMount() {
    this.listsLoadedUnsubscribe = SlackActions.listFiles.completed.listen(ListSelect.onFilesLoaded);
  }

  componentWillUnmount() {
    this.listsLoadedUnsubscribe();
  }

  static updateCheck(event: SyntheticMouseEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    SlackActions.toggleSelected(currentTarget.id);
  }

  static startDownload() {
    SlackActions.getAll();
  }

  static examineFiles() {
    SlackActions.listFiles();
  }

  static abortDownload() {
    SlackActions.resetDownloadState();
    UiActions.setScreen(0);
  }

  static onFilesLoaded() {
    UiActions.setScreen(2);
  }

  static createCheckboxes(list: Array<Object>) {
    const items = [];
    list.forEach(item => {
      let tooltip = '';
      if (item.purpose && item.purpose.value) {
        tooltip = item.purpose.value;
      } else if (item.profile && item.profile.real_name) {
        tooltip = item.name;
      }
      items.push(
        <div
          className="row col-md-12 custom-control custom-checkbox"
          key={`div${item.id}`}
          style={{ lineHeight: '1em', left: '0.25em', paddingRight: 0 }}
          title={tooltip}
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
            className="custom-control-label form-control alert-primary checkbox-label"
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
        <div className="col-md-8">
          <h1><i className="fa fa-slack" /> {this.state.team.name}</h1>
          <div className="col-md-12" style={{ height: 'calc(100% - 11em)', overflowY: 'scroll' }}>
            <h3><i className="fa fa-comments" /> Channels</h3>
            {channels}
            <h3><i className="fa fa-users" /> Groups</h3>
            {groups}
            <h3><i className="fa fa-user" /> Users</h3>
            {users}
          </div>
        </div>
        <div className="col-md-4" style={{ height: 'calc(100% - 4.5em)' }}>
          <button
            onClick={ListSelect.startDownload}
            className="btn btn-primary"
            style={{ height: '26%', marginTop: '4%', width: '100%' }}
            title="Archive selected conversations into the configured folder"
          >
            <div className="row col-md-12">
              <div className="col-md-2" style={{ padding: 0 }}>
                <i className="fa fa-cloud-download" />
              </div>
              <div className="col-md-10">
                Download
              </div>
            </div>
          </button>
          <button
            onClick={ListSelect.examineFiles}
            className="btn btn-warning"
            style={{ height: '26%', marginTop: '7%', width: '100%' }}
            title="List files associated with account and allow deletion"
          >
            <div className="row col-md-12">
              <div className="col-md-2" style={{ padding: 0 }}>
                <i className="fa fa-trash" />
              </div>
              <div className="col-md-10" style={{ alignContent: 'right' }} >
                View Files
              </div>
            </div>
          </button>
          <button
            onClick={ListSelect.abortDownload}
            className="btn btn-secondary"
            style={{ height: '26%', marginTop: '7%', width: '100%' }}
            title="Return to the configuration screen"
          >
            <div className="row col-md-12">
              <div className="col-md-2" style={{ padding: 0 }}>
                <i className="fa fa-undo" />
              </div>
              <div className="col-md-10" style={{ alignContent: 'right' }} >
                Back
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }
}
