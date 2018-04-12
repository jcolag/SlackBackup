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
      case 2:
        currentPage = <Files key="files" />;
        break;
      default:
        currentPage = <div key="empty" />;
        break;
    }
    return (
      <div style={{ height: '100vh' }}>
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary" style={{ marginBottom: '1em' }} >
          <a className="navbar-brand" draggable={false} href="#"><b><i className="fa fa-slack" /> Slack Backup</b></a>
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarColor01" aria-controls="navbarColor01" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navbarColor01">
            <ul className="navbar-nav mr-auto">
              <li className="nav-item active">
                <a className="nav-link" draggable={false} href="#">Home <span className="sr-only">(current)</span></a>
              </li>
              <li className="nav-item">
                <a className="nav-link" draggable={false} href="#" onClick={Home.showAbout}>About</a>
              </li>
            </ul>
            <form className="form-inline my-2 my-lg-0">
              <input className="form-control mr-sm-2" placeholder="Search" type="text" disabled title="Coming Soon..." />
              <button className="btn btn-disabled my-2 my-sm-0" type="submit" disabled title="Coming Soon...">
                <i className="fa fa-search" /> Search
              </button>
            </form>
          </div>
        </nav>
        <div className={styles.container} style={{ width: '100%' }} data-tid="container">
          <div className="row col-md-12" style={{ left: '2.5em' }}>
            <div className="col-md-2">
              &nbsp;
            </div>
            <div className="col-md-8">
              <ReactCSSTransitionReplace
                transitionName="fade-wait"
                transitionEnterTimeout={1000}
                transitionLeaveTimeout={1000}
              >
                {currentPage}
              </ReactCSSTransitionReplace>
            </div>
            <div className="col-md-2">
              &nbsp;
            </div>
          </div>
          <footer
            className="navbar navbar-expand-lg navbar-light bg-light"
            style={{ bottom: 0, position: 'absolute', width: '100%' }}
          >
            &nbsp;
          </footer>
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
