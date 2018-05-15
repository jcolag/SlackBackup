// @flow
import React from 'react';
import Reflux from 'reflux';
import ReactModal from 'react-modal';
import moment from 'moment';
import { SearchStore } from '../store/searchstore';
import { ThreadActions, ThreadStore } from '../store/threadstore';
import { UiActions, UiStore } from '../store/uistore';

const { clipboard } = require('electron');

type Message = {
  scroll_to: boolean,
  text: string,
  ts: string,
  user_data: {
    color: string,
    real_name: string
  }
};
type Props = {
};

/**
 * Component to show part of a conversation and export selections to the clipboard.
 *
 * @export
 * @class Export
 * @extends {Reflux.Component<Props>}
 */
export default class Export extends Reflux.Component<Props> {
  props: Props;

  /**
   * Creates an instance of Export.
   * @param {Props} props Component properties
   * @memberof Export
   */
  constructor(props: Props) {
    super(props);
    this.stores = [SearchStore, ThreadStore, UiStore];
  }

  /**
   * When the component has loaded, wait for exports.
   *
   * @returns {void} Nothing
   * @memberof Export
   */
  componentDidMount() {
    this.exportHandledUnsubscribe = ThreadActions.export.completed.listen(Export.showMarkdown);
  }

  /**
   * Stop waiting for exports on exit.
   *
   * @returns {void} Nothing
   * @memberof Export
   */
  componentWillUnmount() {
    this.exportHandledUnsubscribe();
  }

  /**
   * Show the exported Markdown.
   *
   * @static
   * @returns {void} Nothing
   * @memberof Export
   */
  static showMarkdown() {
    UiActions.toggleExport(true);
  }

  /**
   * Close the export pop-up.
   *
   * @static
   * @returns {void} Nothing
   * @memberof Export
   */
  static closeMarkdown() {
    UiActions.toggleExport(false);
  }

  /**
   * Copy the exported conversation to the clipboard.
   *
   * @static
   * @returns {void} Nothing
   * @memberof Export
   */
  static copyToClipboard() {
    clipboard.writeText(ThreadStore.state.export);
    UiActions.toggleExport(false);
    UiActions.setTransientStatus('Markdown content copied to clipboard!');
  }

  /**
   * Select or de-select a message in the conversation.
   *
   * @static
   * @param {SyntheticMouseEvent<HTMLInputElement>} event Click event
   * @returns {void} Nothing
   * @memberof Export
   */
  static toggleSelection(event: SyntheticMouseEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    const ts = Number(currentTarget.attributes.id.value.substr(3));
    ThreadActions.toggleSelection(ts);
  }

  /**
   * Trigger the export process.
   *
   * @static
   * @returns {void} Nothing
   * @memberof Export
   */
  static convertToMarkdown() {
    ThreadActions.export();
  }

  /**
   * Create individual message components from the message data.
   *
   * @static
   * @param {Array<Message>} messages List of messages in the conversation
   * @returns {Array} Array of components
   * @memberof Export
   */
  static createMessageItems(messages: Array<Message>) {
    const items = [];
    messages.forEach(message => {
      const { color } = message.user_data;
      const border = `1px solid #${color}`;
      const time = moment(Number(message.ts) * 1000);
      const backgroundColor = message.is_selected ? `#${color}` : 'transparent';
      const namePos = message.is_outbound ? 'right' : 'left';
      items.push(
        <label
          className="row col-md-12"
          htmlFor={`cb-${message.ts}`}
          key={message.ts}
          ref={(msg) => {
            if (message.scroll_to) {
              this.scrollTarget = msg;
            }
          }}
          style={{
            backgroundColor,
            border,
            color: message.is_selected ? 'white' : 'inherit',
            borderRadius: '0.25em',
            lineHeight: '1em',
            marginBottom: '1px',
            overflowWrap: 'break-word',
            padding: '0.25em',
            width: '100%'
          }}
        >
          <input
            checked={message.is_selected}
            className="custom-control-input"
            id={`cb-${message.ts}`}
            onChange={Export.toggleSelection}
            style={{ visibility: 'none' }}
            type="checkbox"
          />
          <div
            className="row col-md-12"
            style={{ paddingRight: 0 }}
          >
            <div
              className="col-md-6"
              style={{
                color: message.is_selected ? 'white' : `#${color}`,
                fontSize: 'small',
                fontWeight: 'bold',
                paddingLeft: 0,
                textAlign: namePos,
                width: '100%'
              }}
            >
              {message.user_data.real_name}
            </div>
            <div
              className="col-md-6"
              style={{
                fontSize: 'x-small',
                fontWeight: 'bold',
                paddingRight: 0,
                textAlign: 'right',
                width: '100%'
              }}
            >
              {time.format('ll LT')}
            </div>
          </div>
          <div style={{ width: '100%' }}>
            {message.text}
          </div>
        </label>
      );
    });
    setTimeout(() => {
      if (!this.scrollTarget) {
        return;
      }
      const parent = this.scrollTarget.parentElement;
      let msgTop = this.scrollTarget.offsetTop;
      if (msgTop > 100) {
        msgTop -= 100;
      }
      parent.scrollTop = msgTop;
    }, 300);
    return items;
  }

  /**
   * Render the component.
   *
   * @returns {{}} the component
   * @memberof Export
   */
  render() {
    const messages = Export.createMessageItems(this.state.thread);
    return (
      <div
        className="col-md-12"
        style={{ paddingRight: 0, width: '100%' }}
      >
        <div
          className="row col-md-12"
          style={{
            borderBottom: '1px solid #CCCCCC',
            height: 'calc(100vh - 10em)',
            overflowX: 'hidden',
            overflowY: 'scroll',
            paddingRight: 0,
            width: '100%'
          }}
        >
          {messages}
        </div>
        <div
          className="row col-md-12"
          style={{
            width: '100%'
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={Export.convertToMarkdown}
            style={{ marginTop: '0.25em', width: '100%' }}
          >
            <i className="fa fa-clipboard" />&nbsp;
            Export Selected Messages
          </button>
        </div>
        <ReactModal
          closeTimeoutMS={500}
          contentLabel="...As Markdown"
          isOpen={this.state.exportVisible}
          shouldCloseOnEsc
          style={{
            content: {
              left: '55%',
              width: '40%'
            }
          }}
        >
          <div
            className="col-md-12 table-primary modal-header"
            style={{
              borderTopLeftRadius: '0.5em',
              borderTopRightRadius: '0.5em'
            }}
          >
            <div className="col-md-11" style={{ left: '-1em' }} >
              <h1>As Markdown</h1>
            </div>
            <div className="col-md-1" style={{ left: '1.75em', top: '0.25em' }} >
              <button
                type="button"
                className="close btn btn-outline-primary"
                data-dismiss="modal"
                aria-label="Close"
                onClick={Export.closeMarkdown}
              >
                <span aria-hidden="true" style={{ paddingLeft: '0.25em', paddingRight: '0.25em' }}>
                  <i className="fa fa-2x fa-window-close-o" />
                </span>
              </button>
            </div>
          </div>
          <div
            className="row col-md-12"
            style={{ height: 'calc(100vh - 16em)', left: '1em', padding: 0 }}
          >
            <pre>
              {this.state.export}
            </pre>
          </div>
          <div className="row col-md-12">
            <div className="col-md-2" />
            <div className="col-md-4">
              <button
                type="button"
                className="btn btn-primary"
                data-dismiss="modal"
                aria-hidden="true"
                onClick={Export.copyToClipboard}
                style={{ width: '100%' }}
              >
                <i className="fa fa-clipboard" />
                &nbsp;
                Copy
              </button>
            </div>
            <div className="col-md-4">
              <button
                type="button"
                className="btn btn-primary"
                data-dismiss="modal"
                aria-hidden="true"
                onClick={Export.closeMarkdown}
                style={{ width: '100%' }}
              >
                OK
              </button>
            </div>
            <div className="col-md-2" />
          </div>
        </ReactModal>
      </div>
    );
  }
}
