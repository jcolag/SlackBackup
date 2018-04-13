// @flow
import React from 'react';
import Reflux from 'reflux';
import ReactModal from 'react-modal';
import { UiActions } from '../store/uistore';

type Props = {};
ReactModal.setAppElement('#root');

export default class Nav extends Reflux.Component<Props> {
  props: Props;

  static returnToConfigurationScreen() {
    UiActions.setScreen(0);
  }

  static showAbout() {
    UiActions.toggleAbout(true);
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
            <input className="form-control mr-sm-2" placeholder="Search" type="text" disabled title="Coming Soon..." />
            <button className="btn btn-disabled my-2 my-sm-0" type="submit" disabled title="Coming Soon...">
              <i className="fa fa-search" /> Search
            </button>
          </form>
        </div>
      </nav>
    );
  }
}
