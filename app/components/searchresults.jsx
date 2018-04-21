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
    list.sort((a, b) => a.score - b.score).forEach(message => {
      const time = moment(new Date(message.item.ts * 1000)).format('ll LT');
      const fileFrags = message.file.split('/');
      const nFrags = fileFrags.length;
      const tooltip = `Team: ${fileFrags[nFrags - 2]}\n${fileFrags[nFrags - 1]}\n${time}\nMatch Quality: ${1 - message.score}`;
      const lineWidth = message.is_selected ? '3px' : '1px';
      let username = message.item.user;
      let userColor = '#999999';
      const text = [];
      let lastIndex = 0;
      message.matches[0].indices.forEach(match => {
        const start = match[0];
        const end = match[1];
        let len = start - lastIndex;
        let blurb = message.item.text.substr(lastIndex, len);
        text.push(<span key={`s${items.length}:${text.length}`}>{blurb}</span>);
        len = (end - start) + 1;
        blurb = message.item.text.substr(start, len);
        text.push(<b key={`b${items.length}:${text.length}`}>{blurb}</b>);
        lastIndex = end + 1;
      });
      text.push(<span>{message.item.text.substr(lastIndex)}</span>);
      if (message.user_object) {
        if (message.user_object.real_name) {
          username = message.user_object.real_name;
        } else {
          username = message.user_object.name;
        }
        if (message.user_object.color) {
          userColor = `#${message.user_object.color}`;
        }
      }
      const who = (
        <div
          className="col-md-3"
          key={`${message.user}${message.item.ts}`}
          style={{
            color: userColor,
            fontWeight: 'bold',
            padding: 0,
            paddingTop: '0.25em',
            textAlign: message.user_sent ? 'left' : 'right',
          }}
        >
          {username}
        </div>
      );
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
          {message.user_sent && who}
          <div
            className="col-md-9"
            key={`who${message.item.ts}`}
            style={{
              border: `${lineWidth} solid ${userColor}`,
              borderRadius: '0.5em',
              padding: '0.25em',
              userSelect: 'text',
            }}
          >
            {text}
          </div>
          {!message.user_sent && who}
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
