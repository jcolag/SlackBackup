// @flow
import React from 'react';
import Reflux from 'reflux';
import { UiActions } from '../store/uistore';

const { shell } = require('electron');

const ccByUrl = 'https://creativecommons.org/licenses/by/3.0/us/';
const gplUrl = 'https://www.gnu.org/licenses/gpl-3.0.en.html';
const iconUrl = 'https://thenounproject.com/jum/collection/motion-pictograms/?i=126781';
const johnUrl = 'https://john.colagioia.net';
const repoUrl = 'https://github.com/jcolag/SlackBackup';
const slackUrl = 'https://slack.com/terms-of-service';

/**
 * The about box.
 *
 * @export
 * @class About
 * @extends {Reflux.Component}
 */
export default class About extends Reflux.Component {
  /**
   * Signal to close the about box.
   *
   * @static
   * @returns {void} Nothing
   * @memberof About
   */
  static closeAbout() {
    UiActions.toggleAbout(false);
  }

  /**
   * Open a browser to show the GPL.
   *
   * @static
   * @returns {void} Nothing
   * @memberof About
   */
  static openGpl() {
    shell.openExternal(gplUrl);
  }

  /**
   * Open John's website.
   *
   * @static
   * @returns {void} Nothing
   * @memberof About
   */
  static openJohn() {
    shell.openExternal(johnUrl);
  }

  /**
   * Open the repository.
   *
   * @static
   * @returns {void} Nothing
   * @memberof About
   */
  static openRepo() {
    shell.openExternal(repoUrl);
  }

  /**
   * Open a browser to Slack's terms of service.
   *
   * @static
   * @returns {void} Nothing
   * @memberof About
   */
  static openSlack() {
    shell.openExternal(slackUrl);
  }

  /**
   * Open a browser to CC-BY-3.0.
   *
   * @static
   * @returns {void} Nothing
   * @memberof About
   */
  static openCcBy() {
    shell.openExternal(ccByUrl);
  }

  /**
   * Open a browser to the icon source at the Noun Project.
   *
   * @static
   * @returns {void} Nothing
   * @memberof About
   */
  static openIcon() {
    shell.openExternal(iconUrl);
  }

  /**
   * Render the component.
   *
   * @returns {{}} the component
   * @memberof About
   */
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
            <p style={{ fontSize: 'small' }}>
              The program icon is based on
              <a
                draggable={false}
                href="#"
                onClick={About.openIcon}
                style={{ marginLeft: '0.3em' }}
              >
                TV
              </a> by Jems Mayor from the Noun Project under the terms of the
              <a
                draggable={false}
                href="#"
                onClick={About.openCcBy}
                style={{ marginLeft: '0.3em' }}
              >
                Creative Commons Attribution 3.0
              </a> license.
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
