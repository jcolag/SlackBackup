// @flow
import React from 'react';
import Reflux from 'reflux';
import styles from './Home.css';
import Configuration from './configuration';
import ListSelect from './listselect';
import { SlackStore } from '../store/slackstore';
import { UiActions, UiStore } from '../store/uistore';

type Props = {};

export default class Home extends Reflux.Component<Props> {
  props: Props;

  constructor(props: Props) {
    super(props);
    this.stores = [SlackStore, UiStore];
  }

  componentDidMount() {
    this.listsLoadedUnsubscribe = SlackActions.getLists.completed.listen(Home.onListsLoaded);
  }

  componentWillUnmount() {
    this.listsLoadedUnsubscribe();
  }

  static onListsLoaded() {
    UiActions.setScreen(1);
  }

  render() {
    let currentPage = <div />;
    switch (this.state.screenToDisplay) {
      case 0:
        currentPage = <Configuration key="config" />;
        break;
      case 1:
        currentPage = <ListSelect key="select" />;
        break;
      default:
        currentPage = <div key="empty" />;
        break;
    }
    return (
      <div style={{ height: '100vh' }}>
        <div className={styles.container} style={{ width: '100%' }} data-tid="container">
          <div className="row col-md-12">
            <div className="col-md-2">
              &nbsp;
            </div>
            <div className="col-md-8">
              {currentPage}
            </div>
            <div className="col-md-2">
              &nbsp;
            </div>
          </div>
        </div>
      </div>
    );
  }
}
