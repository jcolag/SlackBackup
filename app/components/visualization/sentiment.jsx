// @flow
import React from 'react';
import Reflux from 'reflux';
import { ConfigStore } from '../../store/configstore';
import { SearchActions } from '../../store/searchstore';
import { ThreadActions } from '../../store/threadstore';
import { UiActions } from '../../store/uistore';
import { VisualizationActions, VisualizationStore } from '../../store/visualizationstore';

const d3 = require('d3');
const path = require('path');

type Props = {
};

/**
 * The sentiment visualizer.
 *
 * @export
 * @class Sentiment
 * @extends {Reflux.Component<Props>}
 */
export default class Sentiment extends Reflux.Component<Props> {
  props: Props;

  /**
   * Creates an instance of Sentiment.
   * @param {Props} props Component properties
   * @memberof Sentiment
   */
  constructor(props: Props) {
    super(props);
    this.stores = [ConfigStore, VisualizationStore];
  }

  /**
   * When the component has loaded, request sentiment data and wait for it.
   *
   * @returns {void} Nothing
   * @memberof Sentiment
   */
  componentDidMount() {
    VisualizationActions.determineSentiment();
    this.dataReadyUnsubscribe = VisualizationActions
      .determineSentiment.completed.listen(this.drawSentiment.bind(this));
  }

  /**
   * Stop waiting for sentiment data on exit.
   *
   * @returns {void} Nothing
   * @memberof Sentiment
   */
  componentWillUnmount() {
    this.dataReadyUnsubscribe();
  }

  /**
   * Draw the sentiment bubble chart.
   *
   * @returns {void} Nothing
   * @memberof Sentiment
   */
  drawSentiment() {
    const normalize = this.state.comparativeSentiment;
    const container = d3.select(this.sentiment);
    const { clientHeight, clientWidth } = container._groups[0][0];
    let minTs = Number.MAX_VALUE;
    let maxTs = -Number.MAX_VALUE;
    let minScore = Number.MAX_VALUE;
    let maxScore = -Number.MAX_VALUE;
    this.state.sentiments.forEach(sentiment => {
      if (sentiment.ts < minTs) {
        minTs = sentiment.ts;
      }
      if (sentiment.ts > maxTs) {
        maxTs = sentiment.ts;
      }
      if (sentiment.value(normalize) < minScore) {
        minScore = sentiment.value(normalize);
      }
      if (sentiment.value(normalize) > maxScore) {
        maxScore = sentiment.value(normalize);
      }
    });
    const xScale = d3
      .scaleLinear()
      .domain([minTs, maxTs])
      .range([30, clientWidth - 5]);
    const yScale = d3
      .scaleLinear()
      .domain([maxScore, minScore])
      .range([5, clientHeight - 5]);
    const yAxis = d3.axisLeft()
      .scale(yScale);
    container.append('g')
      .attr('transform', `translate(30,${yScale(0)})`)
      .append('line')
      .attr('stroke', '#eee')
      .attr('x1', 1)
      .attr('x2', xScale(maxTs));
    container.append('g')
      .attr('transform', 'translate(25,0)')
      .call(yAxis);
    this.state.sentiments.sort((a, b) => b.words - a.words).forEach(sentiment => {
      const {
        team, text, time, ts, words
      } = sentiment;
      const score = sentiment.value(normalize);
      const user = sentiment.to_user;
      const { color } = this.state.useUserColor ? user : sentiment;
      container
        .append('circle')
        .attr('cx', xScale(ts))
        .attr('cy', yScale(score))
        .attr('r', Math.log2(words + 1) + 1)
        .on('click', () => {
          const { filename } = sentiment;
          const datats = sentiment.ts;
          const pathParts = filename.split(path.sep);
          UiActions.setScreen(5);
          UiActions.changeGutter(0);
          SearchActions.highlightThread(filename);
          ThreadActions.loadFile(
            pathParts[pathParts.length - 2],
            pathParts[pathParts.length - 1]
          );
          ThreadActions.toggleSelection(datats, true);
        })
        .style('fill', () => `#${color}`)
        .append('title')
        .text(() => `${time}\nfor ${user.real_name} (${team})\nScore: ${score}\n${text}`);
    });
  }

  /**
   * Render the component.
   *
   * @returns {{}} the component
   * @memberof Sentiment
   */
  render() {
    return (
      <svg
        ref={(svg) => { this.sentiment = svg; }}
        style={{
          border: '1px solid lightGray',
          height: 'calc(100vh - 10em)',
          width: 'calc(100% - 2px)'
        }}
      />
    );
  }
}
