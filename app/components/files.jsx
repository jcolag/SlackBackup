// @flow
import React from 'react';
import Reflux from 'reflux';
import moment from 'moment';
import { ConfigStore } from '../store/configstore';
import { SlackActions, SlackStore } from '../store/slackstore';

const { shell } = require('electron');

type Props = {};

/**
 * Screen to list files for deletion.
 *
 * @export
 * @class Files
 * @extends {Reflux.Component<Props>}
 */
export default class Files extends Reflux.Component<Props> {
  props: Props;

  /**
   * Creates an instance of Files.
   * @param {Props} props Object properties
   * @memberof Files
   */
  constructor(props: Props) {
    super(props);
    this.stores = [ConfigStore, SlackStore];
    this.state = {
      addingToken: false,
      newTokenLength: 0,
    };
  }

  /**
   * Handles the selection/de-selection of a file.
   *
   * @static
   * @param {SyntheticMouseEvent<HTMLInputElement>} event The mouse event
   * @returns {void} Nothing
   * @memberof Files
   */
  static updateCheck(event: SyntheticMouseEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    SlackActions.toggleSelected(currentTarget.id);
  }

  /**
   * Launch browser to view file.
   *
   * @static
   * @param {SyntheticMouseEvent<HTMLInputElement>} event The mouse event
   * @returns {void} Nothing
   * @memberof Files
   */
  static showFile(event: SyntheticMouseEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    shell.openExternal(currentTarget.value);
  }

  /**
   * Delete the selected file.
   *
   * @static
   * @returns {void} Nothing
   * @memberof Files
   */
  static deleteSelected() {
    SlackActions.deleteFiles();
  }

  /**
   * Creates controls to describe each file.
   *
   * @static
   * @param {Array<Object>} list File objects
   * @returns {Array} the list of controls
   * @memberof Files
   */
  static createFileControls(list: Array<{
    created: number,
    id: string,
    name: string,
    permalink: string,
    pretty_type: string,
    shouldDelete: boolean,
    size: number,
    title: string
  }>) {
    const result = [];
    const now = +new Date() / 1000;
    list.forEach(item => {
      const created = moment(item.created * 1000).format('ll LT');
      const daysAgo = Math.round((now - item.created) / (60 * 60 * 24));
      let filename = '';
      let type = ` (${item.pretty_type})`;
      if (item.title) {
        filename = item.title;
      } else if (item.name) {
        filename = item.name;
      } else {
        filename = `${item.pretty_type} file`;
        type = '';
      }
      const tooltip = `${filename}${type} ${Files.size(item.size)}, created ${created} (${daysAgo} days ago).`;
      result.push(
        <div
          className="row col-md-12"
          key={`div${item.id}`}
          style={{ marginRight: '0 !important', paddingBottom: '0.1em', paddingRight: 0 }}
        >
          <div
            className="col-md-8 custom-control custom-checkbox"
            style={{ lineHeight: '1em', left: '0.25em' }}
            title={tooltip}
          >
            <input
              checked={item.shouldDelete}
              className="custom-control-input"
              id={item.id}
              key={item.id}
              onChange={Files.updateCheck}
              type="checkbox"
            />
            <label
              className="custom-control-label form-control alert-primary checkbox-label"
              htmlFor={item.id}
              key={`label${item.id}`}
              style={{ overflowX: 'hidden' }}
            >
              {filename}
            </label>
          </div>
          <div className="col-md-4" style={{ paddingRight: 0 }}>
            <button
              onClick={Files.showFile.bind(item.permalink)}
              className="btn btn-primary"
              title={`Open ${item.permalink} in a browser`}
              value={item.permalink}
            >
              <div className="row col-md-12">
                <div className="col-md-2" style={{ padding: 0 }}>
                  <i className="fa fa-globe" />
                </div>
                <div className="col-md-10">
                  Show
                </div>
              </div>
            </button>
          </div>
        </div>
      );
    });
    return result;
  }

  /**
   * Convert a number of bytes to a readable file size.
   *
   * @static
   * @param {number} sz size in bytes
   * @returns {string} the string representation
   * @memberof Files
   */
  static size(sz: number) {
    const prefixes = 'KMGTPEZY';
    let magnitude = -1;
    let n = sz;
    while (n > 1023) {
      magnitude += 1;
      n /= 1024;
    }
    const prefix = magnitude < 0 ? '' : prefixes[magnitude];
    return `${Math.round(n)} ${prefix}B`;
  }

  /**
   * Renders the component.
   *
   * @returns {{}} The component markup
   * @memberof Files
   */
  render() {
    const files = Files.createFileControls(this.state.files);
    let size = 0;
    this.state.files.forEach(file => {
      size += file.size;
    });
    return (
      <div className="row col-md-12" style={{ height: '100vh', textAlign: 'left' }}>
        <div className="row col-md-12">
          <h1>
            <i className="fa fa-files-o" />&nbsp;
            {this.state.files.length} Files ({Files.size(size)})
          </h1>
        </div>
        <div className="row col-md-12" style={{ height: '100%' }}>
          <div className="col-md-10" style={{ height: 'calc(100% - 11em)', overflowY: 'scroll', padding: 0 }}>
            {files}
          </div>
          <div className="col-md-2">
            <button
              onClick={Files.deleteSelected}
              className="btn btn-danger"
              style={{ height: 'calc(100% - 11em)', width: '100%' }}
              title="Slack may not actually delete files until tomorrow"
            >
              <span style={{ display: 'inline-block', transform: 'rotate(-90deg) translateX(-175%)', width: '100%' }} >
                <i className="fa fa-trash" />
                &nbsp;
                <b>Delete Selected Files</b>
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
