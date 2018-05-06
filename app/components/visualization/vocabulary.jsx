// @flow
import React from 'react';
import Reflux from 'reflux';
import { VisualizationActions, VisualizationStore } from '../../store/visualizationstore';

const d3 = require('d3');

type Props = {
};

/**
 * The vocabulary visualizer.
 *
 * @export
 * @class Vocabulary
 * @extends {Reflux.Component<Props>}
 */
export default class Vocabulary extends Reflux.Component<Props> {
  props: Props;

  /**
   * Creates an instance of Vocabulary.
   * @param {Props} props Component properties.
   * @memberof Vocabulary
   */
  constructor(props: Props) {
    super(props);
    this.stores = [VisualizationStore];
  }

  /**
   * When the component has loaded, request vocabulary data and wait for it.
   *
   * @returns {void} Nothing
   * @memberof Vocabulary
   */
  componentDidMount() {
    VisualizationActions.determineVocabulary();
    this.dataReadyUnsubscribe = VisualizationActions
      .determineVocabulary.completed.listen(this.drawVocabulary.bind(this));
  }

  /**
   * Stop waiting for vocabulary data on exit.
   *
   * @returns {void} Nothing
   * @memberof Vocabulary
   */
  componentWillUnmount() {
    this.dataReadyUnsubscribe();
  }

  /**
   * Draw the vocabulary frequency bar chart.
   *
   * @returns {void} Nothing
   * @memberof Vocabulary
   */
  drawVocabulary() {
    const words = this.state.wordList.sort((a, b) => b.count - a.count);
    const container = d3.select(this.vocabulary);
    const { clientHeight, clientWidth } = container._groups[0][0];
    // Truncate the words if they won't fit
    const maxWord = Math.min(words.length, clientWidth / 4);
    const minIndex = 0;
    const maxIndex = maxWord * 11.1;
    let maxScore = Number.MIN_VALUE;
    words.forEach(word => {
      if (word.count > maxScore) {
        maxScore = word.count;
      }
    });
    // Round the maximum up by the next-biggest order of magnitude
    const magnitude = 10 ** Math.trunc(-Math.log10(maxScore) + 1);
    maxScore = Math.round((maxScore * magnitude) + 0.5) / magnitude;
    const xScale = d3
      .scaleLinear()
      .domain([minIndex, maxIndex])
      .range([40, clientWidth - 5]);
    const yScale = d3
      .scaleLinear()
      .domain([0, maxScore])
      .range([5, clientHeight - 5]);
    const yAxis = d3.axisLeft()
      .scale(yScale);
    container.append('g')
      .attr('transform', `translate(40,${yScale(0)})`)
      .attr('x1', 1)
      .attr('x2', xScale(maxIndex));
    container.append('g')
      .attr('transform', 'translate(35,0)')
      .call(yAxis);
    for (let i = 0; i < maxWord; i += 1) {
      const {
        color, count, examples, stem
      } = words[i];
      const unique = examples.filter((v, idx, a) => a.indexOf(v) === idx);
      container
        .append('rect')
        .attr('x', xScale(i * 11))
        .attr('y', yScale(0))
        .attr('height', yScale(count) - yScale(0))
        .attr('width', xScale(10) - xScale(0))
        .style('fill', () => `#${color}`)
        .append('title')
        .text(`${stem} - ${count}\n${unique.sort().join(', ')}`);
    }
  }

  /**
   * Render the component.
   *
   * @returns {{}} the component
   * @memberof Vocabulary
   */
  render() {
    return (
      <svg
        ref={(svg) => { this.vocabulary = svg; }}
        style={{
          border: '1px solid lightGray',
          height: 'calc(100vh - 10em)',
          width: 'calc(100% - 2px)'
        }}
      />
    );
  }
}
