// @flow
import React from 'react';
import Reflux from 'reflux';
import { UiActions } from '../store/uistore';

const { shell } = require('electron');

const gplUrl = 'https://www.gnu.org/licenses/gpl-3.0.en.html';
const johnUrl = 'https://john.colagioia.net';
const repoUrl = 'https://github.com/jcolag/SlackBackup';
const slackUrl = 'https://slack.com/terms-of-service';

export default class About extends Reflux.Component {
  static closeAbout() {
    UiActions.toggleAbout(false);
  }

  static openGpl() {
    shell.openExternal(gplUrl);
  }

  static openJohn() {
    shell.openExternal(johnUrl);
  }

  static openRepo() {
    shell.openExternal(repoUrl);
  }

  static openSlack() {
    shell.openExternal(slackUrl);
  }

  render() {
    return (
      <div>
        <div
          className="col-md-12 table-primary modal-header"
          style={{
            borderTopLeftRadius: '0.5em',
            borderTopRightRadius: '0.5em'
          }}
        >
          <div className="col-md-11" style={{ left: '-1em' }} >
            <h1>About Slack Backup</h1>
          </div>
          <div className="col-md-1" style={{ left: '1.75em', top: '0.25em' }} >
            <button
              type="button"
              className="close btn btn-outline-primary"
              data-dismiss="modal"
              aria-label="Close"
              onClick={About.closeAbout}
            >
              <span aria-hidden="true" style={{ paddingLeft: '0.25em', paddingRight: '0.25em' }}>
                <i className="fa fa-2x fa-window-close-o" />
              </span>
            </button>
          </div>
        </div>
        <div className="row col-md-12 modal-body">
          <div className="row col-md-12">
            <p>
              The <b>Slack Backup</b> application
              is <i className="fa fa-copyright" /> 2018
              John Colagioia, released under the
              <a
                draggable={false}
                href="#"
                onClick={About.openGpl}
                style={{ marginLeft: '0.3em' }}
              >
                GNU General Public License, version 3
              </a>.  It has no affiliation with Slack except the use of its
              public API.
            </p>
            <p>
              Get or fork the source code, or file bugs and pull requests,
              at the
              <a
                draggable={false}
                href="#"
                onClick={About.openRepo}
                style={{ marginLeft: '0.3em' }}
              >
                <i className="fa fa-github" /> GitHub
              </a> repository.
            </p>
            <p>
              Obviously not intended for use in violation of
              <a
                draggable={false}
                href="#"
                onClick={About.openSlack}
                style={{ marginLeft: '0.3em' }}
              >
                <i className="fa fa-slack" /> Slack&rsquo;s Terms of Service
              </a> or intended to infringe on any trademarks.  It is also
              not intended for use in violating any rules or norms that the
              Slack team might have in place.  Use at your own risk.
            </p>
          </div>
          <div className="row col-md-12">
            <div className="col-md-4" />
            <div className="col-md-4">
              <button
                type="button"
                className="btn btn-primary"
                data-dismiss="modal"
                aria-hidden="true"
                onClick={About.closeAbout}
                style={{ width: '100%' }}
              >
                OK
              </button>
            </div>
            <div className="col-md-4" />
          </div>
        </div>
      </div>);
  }
}