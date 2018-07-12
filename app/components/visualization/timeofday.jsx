// @flow
import React from 'react';
import Reflux from 'reflux';
import moment from 'moment';
import { ConfigStore } from '../../store/configstore';
import { VisualizationActions, VisualizationStore } from '../../store/visualizationstore';

const d3 = require('d3');

type Props = {
};

/**
 * The time of day visualizer.
 *
 * @export
 * @class TimeOfDay
 * @extends {Reflux.Component<Props>}
 */
export default class TimeOfDay extends Reflux.Component<Props> {
  props: Props;

  /**
   * Creates an instance of Times.
   * @param {Props} props Component properties
   * @memberof TimeOfDay
   */
  constructor(props: Props) {
    super(props);
    this.stores = [ConfigStore, VisualizationStore];
  }

  /**
   * When the component has loaded, request times data and wait for it.
   *
   * @returns {void} Nothing
   * @memberof TimeOfDay
   */
  componentDidMount() {
    VisualizationActions.determineTimes();
    this.dataReadyUnsubscribe = VisualizationActions
      .determineTimes.completed.listen(this.drawTimes.bind(this));
  }

  /**
   * Stop waiting for times data on exit.
   *
   * @returns {void} Nothing
   * @memberof TimeOfDay
   */
  componentWillUnmount() {
    this.dataReadyUnsubscribe();
  }

  /**
   * Draw the timing bubble chart.
   *
   * @returns {void} Nothing
   * @memberof TimeOfDay
   */
  drawTimes() {
    const container = d3.select(this.sentiment);
    const { clientHeight, clientWidth } = container._groups[0][0];
    const ctz = new Date().getTimezoneOffset();
    let minTime = Number.MAX_VALUE;
    let maxTime = -Number.MAX_VALUE;
    let minDay = Number.MAX_VALUE;
    let maxDay = -Number.MAX_VALUE;
    this.state.times.forEach(time => {
      if (time.day < minDay) {
        minDay = time.day;
      }
      if (time.day > maxDay) {
        maxDay = time.day;
      }
      if (time.time < minTime) {
        minTime = time.time;
      }
      if (time.time > maxTime) {
        maxTime = time.time;
      }
    });
    minTime = Math.trunc((minTime - (ctz * 60)) / 3600) - 2;
    maxTime = Math.trunc((maxTime - (ctz * 60)) / 3600) + 2;
    const xScale = d3
      .scaleLinear()
      .domain([minDay, maxDay])
      .range([30, clientWidth - 5]);
    const yScale = d3
      .scaleLinear()
      .domain([maxTime, minTime])
      .range([5, clientHeight - 5]);
    const yAxis = d3.axisLeft()
      .scale(yScale);
    container.append('g')
      .attr('transform', `translate(30,${yScale(0)})`)
      .append('line')
      .attr('stroke', '#eee')
      .attr('x1', 1)
      .attr('x2', xScale(maxDay));
    container.append('g')
      .attr('transform', 'translate(25,0)')
      .call(yAxis);
    this.state.times.sort((a, b) => b.words - a.words).forEach(tod => {
      const {
        day, text, time, ts, words
      } = tod;
      const tz = new Date(ts * 1000).getTimezoneOffset();
      const user = tod.to_user;
      const { color } = this.state.useUserColor ? user : tod;
      container
        .append('circle')
        .attr('cx', xScale(day))
        .attr('cy', yScale((time - (tz * 60)) / 3600))
        .attr('r', Math.log2(words + 1))
        .style('fill', () => `#${color}`)
        .append('title')
        .text(() => `${moment(ts * 1000).format('dddd, MMMM Do YYYY, h:mm:ss a')}\nfor ${user.real_name}\n${text}`);
    });
  }

  /**
   * Render the component.
   *
   * @returns {{}} the component
   * @memberof TimeOfDay
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
