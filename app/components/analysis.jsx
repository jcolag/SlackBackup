// @flow
import React from 'react';
import Reflux from 'reflux';
import Relationship from './visualization/relationship';
import Sentiment from './visualization/sentiment';
import Vocabulary from './visualization/vocabulary';
import { VisualizationStore } from '../store/visualizationstore';

const d3 = require('d3');

type Props = {
};

/**
 * A screen for analysis and visualizations.
 *
 * @export
 * @class Analysis
 * @extends {Reflux.Component<Props>}
 */
export default class Analysis extends Reflux.Component<Props> {
  props: Props;

  /**
   * Creates an instance of Analysis.
   * @param {Props} props Component properties
   * @memberof Analysis
   */
  constructor(props: Props) {
    super(props);
    this.stores = [VisualizationStore];
    this.state = {
      whichVisualization: -1,
    };
  }

  /**
   * Reset all visualizations.
   *
   * @static
   * @returns {void} Nothing
   * @memberof Analysis
   */
  static resetVisualization() {
    d3.selectAll('svg > *').remove();
  }

  /**
   * Show the sentiment visualization.
   *
   * @returns {void} Nothing
   * @memberof Analysis
   */
  showSentiment() {
    this.setState({
      whichVisualization: 1,
    });
  }

  /**
   * Show the relationship visualization.
   *
   * @returns {void} Nothing
   * @memberof Analysis
   */
  showRelationships() {
    this.setState({
      whichVisualization: 2,
    });
  }

  /**
   * Show the vocabulary visualization.
   *
   * @returns {void} Nothing
   * @memberof Analysis
   */
  showVocabulary() {
    this.setState({
      whichVisualization: 3,
    });
  }

  /**
   * Render the component.
   *
   * @returns {{}} the component
   * @memberof Analysis
   */
  render() {
    let vis;
    switch (this.state.whichVisualization) {
      case 1:
        vis = <Sentiment />;
        break;
      case 2:
        vis = <Relationship />;
        break;
      case 3:
        vis = <Vocabulary />;
        break;
      default:
        vis = (
          <svg
            ref={(svg) => { this.sentiment = svg; }}
            style={{
            border: '1px solid lightGray',
            height: 'calc(100vh - 10em)',
            width: 'calc(100% - 2px)'
          }}
          />
        );
        break;
    }

    return (
      <div className="row col-md-12" style={{ top: '-1em' }}>
        <nav
          className="navbar navbar-expand-lg navbar-dark bg-primary"
          style={{ left: '-0.5em', marginBottom: 0, width: '100%' }}
        >
          <div className="collapse navbar-collapse" id="navbarColor01">
            <ul className="navbar-nav mr-auto">
              <li className="nav-item">
                <a
                  className="nav-link"
                  draggable={false}
                  href="#"
                  onClick={this.showSentiment.bind(this)}
                >
                  Sentiment <span className="sr-only">(current)</span>
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  draggable={false}
                  href="#"
                  onClick={this.showRelationships.bind(this)}
                >
                  Relationships
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  draggable={false}
                  href="#"
                  onClick={this.showVocabulary.bind(this)}
                >
                  Vocabulary
                </a>
              </li>
            </ul>
          </div>
        </nav>
        <div className="row col-md-12" style={{ left: '0.5em', paddingLeft: 0, paddingRight: 0 }}>
          {vis}
        </div>
      </div>
    );
  }
}
