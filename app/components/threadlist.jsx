// @flow
import React from 'react';
import Reflux from 'reflux';
import Export from './export';
import { SearchActions, SearchStore } from '../store/searchstore';
import { ThreadActions } from '../store/threadstore';
import { UiStore } from '../store/uistore';

const path = require('path');

type Props = {};

/**
 * Screen to choose and display individual conversations.
 *
 * @export
 * @class ThreadList
 * @extends {Reflux.Component<Props>}
 */
export default class ThreadList extends Reflux.Component<Props> {
  props: Props;

  /**
   * Creates an instance of ThreadList.
   * @param {Props} props Component properties
   * @memberof ThreadList
   */
  constructor(props: Props) {
    super(props);
    this.stores = [SearchStore, UiStore];
  }

  /**
   * Select and de-select conversations.
   *
   * @static
   * @param {SyntheticMouseEvent<HTMLInputElement>} event Click event
   * @returns {void} Nothing
   * @memberof ThreadList
   */
  static toggleSelection(event: SyntheticMouseEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    const pathName = currentTarget.attributes.id.value.substr(2);
    const pathParts = pathName.split(path.sep);
    SearchActions.highlightThread(pathName);
    ThreadActions.loadFile(pathParts[pathParts.length - 2], pathParts[pathParts.length - 1]);
  }

  /**
   * Generate select-able components representing available conversations.
   *
   * @static
   * @param {{}} items Conversations organized by team and type
   * @returns {Array} Array of conversation components with headers
   * @memberof ThreadList
   */
  static createConversationItems(items: {}) {
    const result = [];
    Object.keys(items).forEach(team => {
      result.push(<h2 key={team}><i className="fa fa-slack" /> {team}</h2>);
      Object.keys(items[team]).forEach(itemType => {
        let title = '';
        switch (itemType) {
          case 'channel':
            title = <span>&nbsp;<i className="fa fa-comments" /> Channels</span>;
            break;
          case 'group':
            title = <span><i className="fa fa-users" /> Groups</span>;
            break;
          case 'im':
            title = <span><i className="fa fa-user" /> Users</span>;
            break;
          default:
            title = <span><i className="fa fa-star-o" /> {itemType}</span>;
            break;
        }
        result.push(<h3 key={`${team} ${itemType}`}>&nbsp;&nbsp;{title}</h3>);
        items[team][itemType].forEach(conv => {
          const style = {
            backgroundColor: conv.is_selected ? '#101010' : '#e0e0e0',
            border: '1px solid black',
            borderRadius: '0.5em',
            color: conv.is_selected ? '#e0e0e0' : '#101010',
            marginBottom: '2px',
            padding: '0.5em',
            width: '100%',
          };
          const dot = conv.user ? <span style={{ color: `#${conv.user.color}` }}>&#x25c9;</span> : null;
          result.push(
            <label htmlFor={`cb${conv.path}`} key={conv.path} style={style}>
              {dot}&nbsp;
              {conv.displayName}
              <input
                checked={conv.is_selected}
                className="custom-control-input"
                id={`cb${conv.path}`}
                key={`cb${conv.path}`}
                onChange={ThreadList.toggleSelection}
                style={{ visibility: 'none' }}
                type="checkbox"
              />
            </label>
          );
        });
      });
    });
    return result;
  }

  /**
   * Render the component.
   *
   * @returns {{}} the component
   * @memberof ThreadList
   */
  render() {
    const filenames = {};
    this.state.searchFiles.forEach(file => {
      const f = file;
      if (f.teamInfo === null || f.teamInfo === undefined) {
        f.teamInfo = {
          team: f.team,
        };
      }
      const { team } = f.teamInfo;
      if (!Object.prototype.hasOwnProperty.call(filenames, team)) {
        filenames[team] = {};
      }
      if (!Object.prototype.hasOwnProperty.call(filenames[team], file.fileType)) {
        filenames[team][file.fileType] = [];
      }
      filenames[team][file.fileType].push(file);
    });
    const conversations = ThreadList.createConversationItems(filenames);
    return (
      <div className="row col-md-12" style={{ height: '100vh', textAlign: 'left' }}>
        <div className="col-md-6" style={{ height: '100vh', textAlign: 'left' }}>
          <h1>
            <i className="fa fa-comments-o" /> Conversations
          </h1>
          <div
            className="col-md-12"
            style={{
              height: 'calc(100% - 11em)',
              overflowX: 'hidden',
              overflowY: 'scroll',
              paddingRight: 0,
            }}
          >
            {conversations}
          </div>
        </div>
        <div className="col-md-6" style={{ height: '100vh', paddingRight: 0 }}>
          <Export />
        </div>
      </div>
    );
  }
}
