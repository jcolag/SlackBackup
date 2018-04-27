// @flow
import React from 'react';
import Reflux from 'reflux';
import { SlackStore } from '../store/slackstore';
import { UiStore } from '../store/uistore';

export default class Footer extends Reflux.Component {
  constructor() {
    super();
    this.stores = [SlackStore, UiStore];
  }

  render() {
    const teamName = this.state.team ? this.state.team.name : 'this team';
    const unread = this.state.unreadMessages;
    const status = unread > 0 ? `You have ${unread} unread messages in ${teamName}` : <span>&nbsp;</span>;
    const percentDone = this.state.itemsProcessed > 0
      ? `${(this.state.itemsProcessed / this.state.itemsToProcess) * 100}%`
      : '0%';
    let progress = <span />;
    if (this.state.itemsToProcess > this.state.itemsProcessed) {
      progress = (
        <span className="progress" style={{ borderRadius: '0.25em', width: '40vw' }}>
          <div
            className="progress-bar progress-bar-striped progress-bar-animated"
            role="progressbar"
            aria-valuenow="75"
            aria-valuemin="0"
            aria-valuemax="100"
            style={{ width: percentDone }}
          >
            {this.state.itemsProcessed}&nbsp;/&nbsp;{this.state.itemsToProcess}
          </div>
        </span>
      );
    }
    return (
      <footer
        className="navbar navbar-expand-lg navbar-light bg-light"
        style={{ bottom: 0, position: 'absolute', width: '100%' }}
      >
        {progress}
        {status}
        {this.state.transientStatus}
        &nbsp;
      </footer>
    );
  }
}
