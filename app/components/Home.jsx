// @flow
import { LocalizationProvider } from 'fluent-react/compat';
import React from 'react';
import Reflux from 'reflux';
import ReactModal from 'react-modal';
import ReactCSSTransitionReplace from 'react-css-transition-replace';
import styles from './Home.css';
import About from './about';
import Analysis from './analysis';
import Configuration from './configuration';
import Files from './files';
import Footer from './footer';
import { generateBundles } from '../l10n';
import ListSelect from './listselect';
import Nav from './nav';
import SearchResults from './searchresults';
import ThreadList from './threadlist';
import { SlackActions } from '../store/slackstore';
import { UiActions, UiStore } from '../store/uistore';
import { VisualizationActions, VisualizationStore } from '../store/visualizationstore';

type Props = {};
ReactModal.setAppElement('#root');

/**
 * Main screen.
 *
 * @export
 * @class Home
 * @extends {Reflux.Component<Props>}
 */
export default class Home extends Reflux.Component<Props> {
  props: Props;

  /**
   * Creates an instance of Home.
   * @param {Props} props Component properties
   * @memberof Home
   */
  constructor(props: Props) {
    super(props);
    this.stores = [UiStore, VisualizationStore];
    VisualizationActions.loadConversations();
  }

  /**
   * Wait for Slack list retrieval to change screens.
   *
   * @returns {void} Nothing
   * @memberof Home
   */
  componentDidMount() {
    this.listsLoadedUnsubscribe = SlackActions.getLists.completed.listen(Home.onListsLoaded);
  }

  /**
   * Stop waiting for Slack lists on exit.
   *
   * @returns {void} Nothing
   * @memberof Home
   */
  componentWillUnmount() {
    this.listsLoadedUnsubscribe();
  }

  /**
   * When the list information is available, go to the relevant screen.
   *
   * @static
   * @returns {void} Nothing
   * @memberof Home
   */
  static onListsLoaded() {
    UiActions.setScreen(1);
  }

  /**
   * Render the component.
   *
   * @returns {{}} the component
   * @memberof Home
   */
  render() {
    const gutterClass = `col-md-${this.state.gutterWidth}`;
    const contentClass = `col-md-${12 - (this.state.gutterWidth * 2)}`;
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
        currentPage = <SearchResults key="searchresults" />;
        break;
      case 4:
        currentPage = <Analysis key="analysis" />;
        break;
      case 5:
        currentPage = <ThreadList key="threadlist" />;
        break;
      default:
        currentPage = <div key="empty" />;
        break;
    }
    return (
      <LocalizationProvider bundles={generateBundles(navigator.languages, this.state.language)}>
        <div style={{ height: '100vh' }}>
          <Nav />
          <div className={styles.container} style={{ width: '100%' }} data-tid="container">
            <div className="row col-md-12" style={{ left: '2.5em' }}>
              <div className={gutterClass} />
              <div className={contentClass}>
                <ReactCSSTransitionReplace
                  transitionName="fade-wait"
                  transitionEnterTimeout={1000}
                  transitionLeaveTimeout={1000}
                >
                  {currentPage}
                </ReactCSSTransitionReplace>
              </div>
              <div className={gutterClass} />
            </div>
            <Footer />
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
      </LocalizationProvider>
    );
  }
}
