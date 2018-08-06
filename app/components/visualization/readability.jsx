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
 * The readability visualizer.
 *
 * @export
 * @class Readability
 * @extends {Reflux.Component<Props>}
 */
export default class Readability extends Reflux.Component<Props> {
  props: Props;

  /**
   * Creates an instance of Readability.
   * @param {Props} props Component properties
   * @memberof Readability
   */
  constructor(props: Props) {
    super(props);
    this.stores = [ConfigStore, VisualizationStore];
  }

  /**
   * When the component has loaded, request readability data and wait for it.
   *
   * @returns {void} Nothing
   * @memberof Readability
   */
  componentDidMount() {
    VisualizationActions.determineReadability();
    this.dataReadyUnsubscribe = VisualizationActions
      .determineReadability.completed.listen(this.drawReadability.bind(this));
  }

  /**
   * Stop waiting for readability data on exit.
   *
   * @returns {void} Nothing
   * @memberof Readability
   */
  componentWillUnmount() {
    this.dataReadyUnsubscribe();
  }

  /**
   * Draw the readability bubble chart.
   *
   * @returns {void} Nothing
   * @memberof Readability
   */
  drawReadability() {
    const container = d3.select(this.readability);
    const { clientHeight, clientWidth } = container._groups[0][0];
    let minTs = Number.MAX_VALUE;
    let maxTs = -Number.MAX_VALUE;
    let minScore = Number.MAX_VALUE;
    let maxScore = -Number.MAX_VALUE;
    this.state.readabilities.forEach(readability => {
      if (readability.ts < minTs) {
        minTs = readability.ts;
      }
      if (readability.ts > maxTs) {
        maxTs = readability.ts;
      }
      if (readability.value < minScore) {
        minScore = readability.value;
      }
      if (readability.value > maxScore) {
        maxScore = readability.value;
      }
    });
    const xScale = d3
      .scaleLinear()
      .domain([minTs, maxTs])
      .range([40, clientWidth - 5]);
    const yScale = d3
      .scaleLinear()
      .domain([maxScore, minScore])
      .range([5, clientHeight - 5]);
    const yAxis = d3.axisLeft()
      .scale(yScale);
    const minLine = Math.trunc(minScore / 10) * 10;
    for (let yVal = minLine; yVal < maxScore; yVal += 10) {
      container.append('g')
        .attr('transform', `translate(35,${yScale(yVal)})`)
        .append('line')
        .attr('stroke', '#eee')
        .attr('x1', 0)
        .attr('x2', xScale(maxTs));
    }
    container.append('g')
      .attr('transform', 'translate(35,0)')
      .call(yAxis);
    this.state.readabilities
      .sort((a, b) => b.text.length - a.text.length)
      .forEach(readability => {
        const {
          text, time, ts
        } = readability;
        const score = readability.value;
        const user = readability.to_user;
        const { color } = this.state.useUserColor ? user : readability;
        container
          .append('circle')
          .attr('cx', xScale(ts))
          .attr('cy', yScale(Number.isNaN(score) ? maxScore : score))
          .attr('r', Math.log(readability.text.split(/\s+/).length) + 1)
          .on('click', () => {
            const { file } = readability;
            const datats = readability.ts;
            const pathParts = file.split(path.sep);
            UiActions.setScreen(5);
            UiActions.changeGutter(0);
            SearchActions.highlightThread(file);
            ThreadActions.loadFile(
              pathParts[pathParts.length - 2],
              pathParts[pathParts.length - 1]
            );
            ThreadActions.toggleSelection(datats, true);
          })
          .style('fill', () => `#${color}`)
          .append('title')
          .text(() => `${time}\nfor ${user.real_name}\nScore: ${score}\n${Readability.explainScore(score)}\n\n${text}`);
      });
  }

  /**
   * Provides a text-based interpretation of the Flesch score.
   *
   * @static
   * @param {Number} score The Flesch readability score
   * @returns {string} explanation
   * @memberof Readability
   */
  static explainScore(score: number) {
    let result = 'Unknown';
    if (score < 30) {
      result = 'College Graduate:  Very difficult to read.';
    } else if (score < 50) {
      result = 'College:  Difficult to read.';
    } else if (score < 60) {
      result = '10th to 12th:  Fairly difficult to read.';
    } else if (score < 70) {
      result = '8th to 9th:  Plain English. Easily understood by 13- to 15-year-old students.';
    } else if (score < 80) {
      result = '7th:  Fairly easy to read.';
    } else if (score < 90) {
      result = '6th:  Easy to read. Conversational English for consumers.';
    } else if (score < 100) {
      result = '5th:  Very easy to read. Easily understood by an average 11-year-old student.';
    } else {
      result = '4th or lower grade level.';
    }
    return result;
  }

  /**
   * Render the component.
   *
   * @returns {{}} the component
   * @memberof Readability
   */
  render() {
    return (
      <svg
        ref={(svg) => { this.readability = svg; }}
        style={{
          border: '1px solid lightGray',
          height: 'calc(100vh - 10em)',
          width: 'calc(100% - 2px)'
        }}
      />
    );
  }
}
