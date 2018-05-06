// @flow
import React from 'react';
import Reflux from 'reflux';
import ReactModal from 'react-modal';
import { SearchActions, SearchStore } from '../store/searchstore';
import { ThreadActions } from '../store/threadstore';
import { UiActions, UiStore } from '../store/uistore';

type Props = {};
ReactModal.setAppElement('#root');

/**
 * The program navigation bar.
 *
 * @export
 * @class Nav
 * @extends {Reflux.Component<Props>}
 */
export default class Nav extends Reflux.Component<Props> {
  props: Props;

  /**
   * Creates an instance of Nav.
   * @param {Props} props Component properties
   * @memberof Nav
   */
  constructor(props: Props) {
    super(props);
    this.stores = [SearchStore];
  }

  /**
   * Change to show configuration screen.
   *
   * @static
   * @returns {void} Nothing
   * @memberof Nav
   */
  static returnToConfigurationScreen() {
    UiActions.setScreen(0);
  }

  /**
   * Show the search results.
   *
   * @static
   * @param {SyntheticMouseEvent<HTMLInputElement>} event Click event
   * @returns {void} Nothing
   * @memberof Nav
   */
  static showSearch(event: SyntheticMouseEvent<HTMLInputElement>) {
    event.preventDefault();
    UiActions.setScreen(3);
  }

  /**
   * Show the analysis and visualization screen.
   *
   * @static
   * @param {SyntheticMouseEvent<HTMLInputElement>} event Click event
   * @returns {void} Nothing
   * @memberof Nav
   */
  static showAnalysis(event: SyntheticMouseEvent<HTMLInputElement>) {
    event.preventDefault();
    UiActions.setScreen(4);
    UiActions.changeGutter(0);
  }

  /**
   * Show the available conversations.
   *
   * @static
   * @param {SyntheticMouseEvent<HTMLInputElement>} event Click event
   * @returns {void} Nothing
   * @memberof Nav
   */
  static showThreads(event: SyntheticMouseEvent<HTMLInputElement>) {
    event.preventDefault();
    SearchActions.updateFileList();
    ThreadActions.clear();
    UiActions.setScreen(5);
    UiActions.changeGutter(0);
  }

  /**
   * Show the about window.
   *
   * @static
   * @returns {void} Nothing
   * @memberof Nav
   */
  static showAbout() {
    UiActions.toggleAbout(true);
  }

  /**
   * Update the search string.
   *
   * @static
   * @param {SyntheticInputEvent<HTMLInputElement>} event Input event
   * @returns {void} Nothing
   * @memberof Nav
   */
  static stringUpdated(event: SyntheticInputEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    SearchActions.updateSearchString(currentTarget.value);
    if (UiStore.state.screenToDisplay === 3) {
      UiActions.changeGutter(2);
    }
    UiActions.setThreadVisible(false);
  }

  /**
   * Render the component.
   *
   * @returns {{}} the component
   * @memberof Nav
   */
  render() {
    return (
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary" style={{ marginBottom: '1em' }} >
        <a
          className="navbar-brand"
          draggable={false}
          href="#"
          onClick={Nav.returnToConfigurationScreen}
        >
          <b><i className="fa fa-slack" /> Slack Backup</b>
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarColor01"
          aria-controls="navbarColor01"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarColor01">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item active">
              <a
                className="nav-link"
                draggable={false}
                href="#"
                onClick={Nav.returnToConfigurationScreen}
              >
                Home <span className="sr-only">(current)</span>
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" draggable={false} href="#" onClick={Nav.showThreads}>Conversations</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" draggable={false} href="#" onClick={Nav.showAnalysis}>Analysis</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" draggable={false} href="#" onClick={Nav.showAbout}>About</a>
            </li>
          </ul>
          <form className="form-inline my-2 my-lg-0">
            <input
              className="form-control mr-sm-2"
              onInput={Nav.stringUpdated}
              placeholder="Search"
              type="text"
            />
            <button className="btn btn-primary my-2 my-sm-0" onClick={Nav.showSearch}>
              <i className="fa fa-search" /> Search
            </button>
          </form>
        </div>
      </nav>
    );
  }
}
