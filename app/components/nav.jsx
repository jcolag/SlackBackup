// @flow
import React from 'react';
import Reflux from 'reflux';
import ReactModal from 'react-modal';
import { SearchActions, SearchStore } from '../store/searchstore';
import { UiActions } from '../store/uistore';

type Props = {};
ReactModal.setAppElement('#root');

export default class Nav extends Reflux.Component<Props> {
  props: Props;

  constructor(props: Props) {
    super(props);
    this.stores = [SearchStore];
  }

  static returnToConfigurationScreen() {
    UiActions.setScreen(0);
  }

  static showSearch() {
    UiActions.setScreen(3);
  }

  static showAbout() {
    UiActions.toggleAbout(true);
  }

  static stringUpdated(event: SyntheticInputEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    SearchActions.updateSearchString(currentTarget.value);
  }

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
            <button className="btn btn-primary my-2 my-sm-0" type="submit" onClick={Nav.showSearch}>
              <i className="fa fa-search" /> Search
            </button>
          </form>
        </div>
      </nav>
    );
  }
}
