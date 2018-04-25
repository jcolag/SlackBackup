// @flow
import React from 'react';
import Reflux from 'reflux';
import moment from 'moment';
import { SearchActions, SearchStore } from '../store/searchstore';
import { ThreadActions } from '../store/threadstore';
import { UiActions, UiStore } from '../store/uistore';

type Message = {
  file: string,
  item: { ts: string, text: string, user: string },
  matches: Array<{ indices: Array<{ }> }>,
  score: number,
  user_object: { color: string | void, name: string, real_name: string | void },
  user_sent: boolean
};

type Props = {};

export default class SearchResults extends Reflux.Component<Props> {
  props: Props;

  constructor(props: Props) {
    super(props);
    this.stores = [SearchStore, UiStore];
  }

  static showThread(event: SyntheticMouseEvent<HTMLInputElement>) {
    const target = event.currentTarget;
    const { datafile, datateam, datats } = target.attributes;
    UiActions.changeGutter(0);
    UiActions.setThreadVisible(true);
    SearchActions.highlightMessage(datats.value);
    ThreadActions.loadFile(datateam.value, datafile.value, Number(datats.value));
  }

  static compareMessages(a: Message, b: Message) {
    if (Number(a.score) !== Number(b.score)) {
      return Number(a.score) - Number(b.score);
    }
    return Number(b.item.ts) - Number(a.item.ts);
  }

  static createMessageDisplays(list: Array<Message>) {
    const items = [];
    let number = 0;
    list.sort(SearchResults.compareMessages).forEach(message => {
      const time = moment(new Date(Number(message.item.ts) * 1000)).format('ll LT');
      const fileFrags = message.file.split('/');
      const nFrags = fileFrags.length;
      const teamName = fileFrags[nFrags - 2];
      const fileName = fileFrags[nFrags - 1];
      const tooltip = `Team: ${teamName}\n${fileName}\n${time}\nMatch Quality: ${1 - message.score}`;
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
        text.push(<span key={`s${lastIndex}`}>{blurb}</span>);
        len = (end - start) + 1;
        blurb = message.item.text.substr(start, len);
        text.push(<b key={`b${lastIndex}`}>{blurb}</b>);
        lastIndex = end + 1;
      });
      text.push(<span key={`b${lastIndex}`}>{message.item.text.substr(lastIndex)}</span>);
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
          key={`who-${number}`}
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
          datafile={fileName}
          key={`msg-${number}`}
          onClick={SearchResults.showThread}
          onKeyPress={SearchResults.showThread}
          role="navigation"
          style={{
            lineHeight: '1em',
            left: '0.25em',
            marginTop: '2px',
            padding: 0
          }}
          datateam={teamName}
          title={tooltip}
          datats={message.item.ts}
        >
          {message.user_sent && who}
          <div
            className="col-md-9"
            key={`text-${number}`}
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
        <div className={resultClass} style={{ height: '100vh', textAlign: 'left' }}>
          <h1>
            <i className="fa fa-search" /> Results for &ldquo;{this.state.target}&rdquo;
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
            {messages}
          </div>
        </div>
      </div>
    );
  }
}
