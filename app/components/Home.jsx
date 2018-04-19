// @flow
import React from 'react';
import Reflux from 'reflux';
import ReactModal from 'react-modal';
import ReactCSSTransitionReplace from 'react-css-transition-replace';
import styles from './Home.css';
import About from './about';
import Configuration from './configuration';
import Files from './files';
import ListSelect from './listselect';
import Nav from './nav';
import SearchResults from './searchresults';
import { SearchStore } from '../store/searchstore';
import { SlackActions, SlackStore } from '../store/slackstore';
import { UiActions, UiStore } from '../store/uistore';

type Props = {};
ReactModal.setAppElement('#root');

export default class Home extends Reflux.Component<Props> {
  props: Props;

  constructor(props: Props) {
    super(props);
    this.stores = [SearchStore, SlackStore, UiStore];
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

  static screenToOpacity(s: number) {
    return this.state.screenToDisplay === s ? 0.0 : 1.0;
  }

  render() {
    const teamName = this.state.team ? this.state.team.name : 'this team';
    const unread = this.state.unreadMessages;
    const status = unread > 0 ? `You have ${unread} unread messages in ${teamName}` : <span>&nbsp;</span>;
    let currentPage = <div />;
    switch (this.state.screenToDisplay) {
      case 0:
        currentPage = <Configuration key="config" />;
        break;
      case 1:
        currentPage = <ListSelect key="select" />;
        break;
      case 2:
        currentPage = <Files key="files" />;
        break;
      case 3:
        currentPage = <SearchResults key="searchresults" />
        break;
      default:
        currentPage = <div key="empty" />;
        break;
    }
    return (
      <div style={{ height: '100vh' }}>
        <Nav />
        <div className={styles.container} style={{ width: '100%' }} data-tid="container">
          <div className="row col-md-12" style={{ left: '2.5em' }}>
            <div className="col-md-2" />
            <div className="col-md-8">
              <ReactCSSTransitionReplace
                transitionName="fade-wait"
                transitionEnterTimeout={1000}
                transitionLeaveTimeout={1000}
              >
                {currentPage}
              </ReactCSSTransitionReplace>
            </div>
            <div className="col-md-2" />
          </div>
          <footer
            className="navbar navbar-expand-lg navbar-light bg-light"
            style={{ bottom: 0, position: 'absolute', width: '100%' }}
          >
            {status}
          </footer>
        </div>
        <ReactModal
          closeTimeoutMS={500}
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
