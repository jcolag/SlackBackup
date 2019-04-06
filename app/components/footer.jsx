// @flow
import React from 'react';
import Reflux from 'reflux';
import { SlackStore } from '../store/slackstore';
import { UiStore } from '../store/uistore';

/**
 * Program status bar.
 *
 * @export
 * @class Footer
 * @extends {Reflux.Component}
 */
export default class Footer extends Reflux.Component {
  /**
   * Creates an instance of Footer.
   * @memberof Footer
   */
  constructor() {
    super();
    this.stores = [SlackStore, UiStore];
  }

  /**
   * Render the footer.
   *
   * @returns {{}} the component
   * @memberof Footer
   */
  render() {
    const teamName = this.state.team ? this.state.team.name : 'this team';
    const unread = this.state.unreadMessages;
    const percentDone = this.state.itemsProcessed > 0
      ? `${(this.state.itemsProcessed / this.state.itemsToProcess) * 100}%`
      : '0%';
    let progress = <span />;
    let status = '';

    switch (unread) {
      case null:
        status = ' ';
        break;
      case 0:
        status = `You are up to date in ${teamName}`;
        break;
      case -1:
        status = `There was a problem downloading messages for ${teamName}`;
        break;
      default:
        status = `You have ${unread} unread messages in ${teamName}`;
        break;
    }

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
