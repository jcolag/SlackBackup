// @flow
import React from 'react';
import Reflux from 'reflux';
import styles from './Home.css';
import Configuration from './configuration';
import ListSelect from './listselect';
import { SlackStore } from '../store/slackstore';

type Props = {};

export default class Home extends Reflux.Component<Props> {
  props: Props;

  constructor(props: Props) {
    super(props);
    this.stores = [SlackStore];
  }

  render() {
    let currentPage = <div />;
    if (!this.state.listsLoading) {
      currentPage = <Configuration />;
    } else {
      currentPage = <ListSelect />;
    }
    return (
      <div >
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
