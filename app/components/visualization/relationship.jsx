// @flow
import React from 'react';
import Reflux from 'reflux';
import { SearchActions } from '../../store/searchstore';
import { ThreadActions } from '../../store/threadstore';
import { UiActions } from '../../store/uistore';
import { VisualizationActions, VisualizationStore } from '../../store/visualizationstore';

const d3 = require('d3');
const path = require('path');

type Props = {
};

/**
 * A weak relationship visualizer.
 *
 * @export
 * @class Relationship
 * @extends {Reflux.Component<Props>}
 */
export default class Relationship extends Reflux.Component<Props> {
  props: Props;

  /**
   * Creates an instance of Relationship.
   * @param {Props} props Visualization properties
   * @memberof Relationship
   */
  constructor(props: Props) {
    super(props);
    this.stores = [VisualizationStore];
    this.state = {
      nodes: [],
      links: [],
    };
  }

  /**
   * When the component is loaded, load the relationship data and wait for it.
   *
   * @returns {void} Nothing
   * @memberof Relationship
   */
  componentDidMount() {
    VisualizationActions.determineRelationships();
    this.dataReadyUnsubscribe = VisualizationActions
      .determineRelationships.completed.listen(this.drawRelationships.bind(this));
  }

  /**
   * Stop waiting for the relationship data on exit.
   *
   * @returns {void} Nothing
   * @memberof Relationship
   */
  componentWillUnmount() {
    this.dataReadyUnsubscribe();
    this.forceSim.stop();
  }

  /**
   * Handles the clicking of user objects in the visualization.
   *
   * @param {({ name: string, team: string } | null)} user The user object
   * @returns {void} Nothing
   * @memberof Relationship
   */
  static handleUserClick(user: { file: string, name: string, team: string } | null) {
    if (user === null) {
      return;
    }
    const { file } = user;
    const pathParts = file.split(path.sep);
    UiActions.setScreen(5);
    UiActions.changeGutter(0);
    SearchActions.highlightThread(file);
    ThreadActions.loadFile(pathParts[pathParts.length - 2], pathParts[pathParts.length - 1]);
  }

  /**
   * Draw the relationships in a force-directed graph.
   *
   * @returns {void} Nothing
   * @memberof Relationship
   */
  drawRelationships() {
    const container = d3.select(this.relationships);
    const { clientHeight, clientWidth } = container._groups[0][0];
    const maxDist = Math.min(clientHeight / 2, clientWidth / 2);
    const { links, nodes } = this.state;
    let maxScore = 0;
    if (links.length === 0) {
      nodes.push({
        color: `#${this.state.localUser[0].user.color}`,
        name: 'You',
        r: 15,
        stroke: `#${this.state.localUser[this.state.localUser.length - 1].user.color}`,
        user: null,
        x: clientWidth / 2,
        y: clientHeight / 2,
      });
      this.state.relationships.forEach(rel => {
        if (rel.in + rel.out < 1) {
          return;
        }
        nodes.push({
          color: `#${rel.color}`,
          in: rel.in,
          name: `${rel.name} (${rel.team})`,
          out: rel.out,
          r: Math.log(rel.in) + 2,
          stroke: rel.teamColor,
          user: rel,
          x: Math.random() * clientWidth,
          y: Math.random() * clientHeight,
        });
        links.push({
          score: rel.out,
          source: 0,
          target: nodes.length - 1,
        });
        if (rel.out > maxScore) {
          maxScore = rel.out;
        }
      });
    }
    this.forceSim = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength((n) => -n.r * 5))
      .force('link', d3.forceLink(links)
        .distance((l) => (maxDist / l.score) + 30)
        .strength((l) => l.score / maxScore))
      .force('x', d3.forceX(clientWidth / 2))
      .force('y', d3.forceY(clientHeight / 2))
      .on('tick', () => this.setState({
        links,
        nodes,
      }));
  }

  /**
   * Render the relationship component.
   *
   * @returns {{}} The component.
   * @memberof Relationship
   */
  render() {
    return (
      <svg
        ref={(svg) => { this.relationships = svg; }}
        style={{
          border: '1px solid lightGray',
          height: 'calc(100vh - 10em)',
          width: 'calc(100% - 2px)'
        }}
      >
        {this.state.links.map((link) =>
          (
            <line
              x1={link.source.x}
              y1={link.source.y}
              x2={link.target.x}
              y2={link.target.y}
              key={`line-${link.source.x}-${link.source.y}-${link.target.x}-${link.target.y}`}
              stroke="black"
            />
          ))}
        {this.state.nodes.map((node) => (
          <circle
            r={node.r}
            cx={node.x}
            cy={node.y}
            fill={node.color}
            key={`node-${node.x}-${node.y}`}
            onClick={Relationship.handleUserClick.bind(this, node.user)}
            stroke={node.stroke}
            strokeWidth="2"
          >
            <title>
              {node.name} &mdash; {node.out} : {node.in}
            </title>
          </circle>
        ))}
      </svg>
    );
  }
}
