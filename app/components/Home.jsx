// @flow
import React from 'react';
import Reflux from 'reflux';
import ReactModal from 'react-modal';
import styles from './Home.css';
import About from './about';
import Configuration from './configuration';
import ListSelect from './listselect';
import { SlackActions, SlackStore } from '../store/slackstore';
import { UiActions, UiStore } from '../store/uistore';

type Props = {};
ReactModal.setAppElement('#root');

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

  static showAbout() {
    UiActions.toggleAbout(true);
  }

  static screenToOpacity(s: number) {
    return this.state.screenToDisplay === s ? 0.0 : 1.0;
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
                <a className="nav-link" draggable={false} href="#" onClick={Home.showAbout}>About</a>
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
        <ReactModal
          closeTimeoutMS={150}
          contentLabel="About Slack Backup"
          isOpen={this.state.aboutVisible}
          shouldCloseOnEsc
          style={{
            content: {
              left: '15%',
              width: '70%'
            }
          }}
        >
          <About />
        </ReactModal>
      </div>
    );
  }
}
