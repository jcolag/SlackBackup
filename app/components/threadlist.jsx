// @flow
import React from 'react';
import Reflux from 'reflux';
import moment from 'moment';
import Export from './export';
import { SearchActions, SearchStore } from '../store/searchstore';
import { ThreadActions } from '../store/threadstore';
import { UiActions, UiStore } from '../store/uistore';

const path = require('path');

type Message = {
  file: { path: string },
  item: { ts: string, text: string, user: string },
  matches: Array<{ indices: Array<{ }> }>,
  score: number,
  user_object: { color: string | void, name: string, real_name: string | void },
  user_sent: boolean
};

type Props = {};

export default class ThreadList extends Reflux.Component<Props> {
  props: Props;

  constructor(props: Props) {
    super(props);
    this.stores = [SearchStore, UiStore];
  }

  static toggleSelection(event: SyntheticMouseEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    const pathName = currentTarget.attributes.id.value.substr(2);
    const pathParts = pathName.split(path.sep);
    SearchActions.highlightThread(pathName);
    ThreadActions.loadFile(pathParts[pathParts.length - 2], pathParts[pathParts.length - 1]);
  }

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
        result.push(<h3 key={`${team}${itemType}`}>&nbsp;&nbsp;{title}</h3>);
        items[team][itemType].forEach(conv => {
          const style = conv.is_selected
            ? {
              backgroundColor: '#101010',
              border: '1px solid black',
              borderRadius: '0.5em',
              color: '#e0e0e0',
              marginBottom: '2px',
              padding: '0.5em',
              width: '100%',
            } : {
              backgroundColor: '#e0e0e0',
              border: '1px solid black',
              borderRadius: '0.5em',
              color: '#101010',
              marginBottom: '2px',
              padding: '0.5em',
              width: '100%',
            };
          result.push(
            <label htmlFor={`cb${conv.path}`} style={style}>
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
            </label>);
        });
      });
    });
    return result;
  }

  render() {
    const filenames = {};
    this.state.searchFiles.forEach(file => {
      const { team } = file.teamInfo;
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
