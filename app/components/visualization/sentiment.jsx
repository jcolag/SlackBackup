// @flow
import React from 'react';
import Reflux from 'reflux';
import { VisualizationActions, VisualizationStore } from '../../store/visualizationstore';

const d3 = require('d3');

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
    this.stores = [VisualizationStore];
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
    const normalize = false;
    const container = d3.select(this.sentiment);
    const { clientHeight, clientWidth } = container._groups[0][0];
    let minTs = Number.MAX_VALUE;
    let maxTs = Number.MIN_VALUE;
    let minScore = Number.MAX_VALUE;
    let maxScore = Number.MIN_VALUE;
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
    this.state.sentiments.forEach(sentiment => {
      const {
        color, text, time, ts
      } = sentiment;
      const score = sentiment.value(normalize);
      container
        .append('circle')
        .attr('cx', xScale(ts))
        .attr('cy', yScale(score))
        .attr('r', 3)
        .style('fill', () => `#${color}`)
        .append('title')
        .text(() => `${time}\nScore: ${score}\n${text}`);
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
