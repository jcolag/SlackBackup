// @flow
import React from 'react';
import Reflux from 'reflux';
import moment from 'moment';
import { SearchStore } from '../store/searchstore';

type Props = {};

export default class SearchResults extends Reflux.Component<Props> {
  props: Props;

  constructor(props: Props) {
    super(props);
    this.stores = [SearchStore];
  }

  static createMessageDisplays(list: Array<Object>) {
    const items = [];
    let number = 0;
    list.sort((a, b) => b.ts - a.ts).forEach(item => {
      const time = moment(new Date(item.ts * 1000)).format('ll LT');
      const fileFrags = item.file.split('/');
      const nFrags = fileFrags.length;
      const tooltip = `Team: ${fileFrags[nFrags - 2]}\n${fileFrags[nFrags - 1]}\n${time}`;
      let username = item.user;
      let userColor = '#999999';
      if (item.user_object) {
        if (item.user_object.real_name) {
          username = item.user_object.real_name;
        } else {
          username = item.user_object.name;
        }
        if (item.user_object.color) {
          userColor = `#${item.user_object.color}`;
        }
      }
      items.push(
        <div
          className="row col-md-12"
          key={`msg${number}`}
          style={{
            lineHeight: '1em',
            left: '0.25em',
            marginTop: '2px',
            padding: 0
          }}
          title={tooltip}
        >
          <div
            className="col-md-3"
            style={{
              color: userColor,
              fontWeight: 'bold',
              padding: 0,
              paddingTop: '0.25em'
            }}
          >
            {username}
          </div>
          <div
            className="col-md-9"
            style={{
              border: `1px solid ${userColor}`,
              borderRadius: '0.5em',
              padding: '0.25em',
              userSelect: 'text',
            }}
          >
            {item.text}
          </div>
        </div>);
      number += 1;
    });
    return items;
  }

  render() {
    const messages = SearchResults.createMessageDisplays(this.state.searchResults);
    return (
      <div className="row col-md-12" style={{ height: '100vh', textAlign: 'left' }}>
        <h1 style={{ height: 0, marginBottom: 0 }}>
          <i className="fa fa-search" /> Results for &ldquo;{this.state.target}&rdquo;
        </h1>
        <div
          className="col-md-12"
          style={{
            height: 'calc(100% - 11em)',
            overflowX: 'hidden',
            overflowY: 'scroll',
            paddingRight: 0,
            top: '-2em'
          }}
        >
          {messages}
        </div>
      </div>
    );
  }
}
