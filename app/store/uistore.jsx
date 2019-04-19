// @flow
import Reflux from 'reflux';

export const UiActions = Reflux.createActions({
  changeGutter: {},
  setScreen: {},
  setThreadVisible: {},
  setTransientStatus: {},
  toggleAbout: {},
  toggleExport: {},
});

/**
 * Store for user interface information.
 *
 * @export
 * @class UiStore
 * @extends {Reflux.Store}
 */
export class UiStore extends Reflux.Store {
  /**
   * Creates an instance of UiStore.
   * @memberof UiStore
   */
  constructor() {
    super();
    this.state = {
      aboutVisible: false,
      exportVisible: false,
      gutterWidth: 2,
      previousScreen: 0,
      screenToDisplay: 0,
      threadVisible: false,
      transientStatus: '',
    };
    this.listenables = UiActions;
    this.resetStatusLine = this.onSetTransientStatus.bind(this, '', -1);
  }

  /**
   * Update the gutter width.
   *
   * @param {number} width Number of (Bootstrap) columns to use
   * @returns {void} Nothing
   * @memberof UiStore
   */
  onChangeGutter(width: number) {
    this.setState({
      gutterWidth: width,
    });
  }

  /**
   * Update the screen to show.
   *
   * @param {number} number The screen number
   * @returns {void} Nothing
   * @memberof UiStore
   */
  onSetScreen(number: number) {
    this.setState({
      gutterWidth: 2,
      previousScreen: this.state.screenToDisplay,
      screenToDisplay: number,
      threadVisible: false,
    });
  }

  /**
   * Mark a thread as showable or not.
   *
   * @param {boolean} [shouldShow=false] The desired state
   * @returns {void} Nothing
   * @memberof UiStore
   */
  onSetThreadVisible(shouldShow: boolean = false) {
    this.setState({ threadVisible: shouldShow });
  }

  /**
   * Mark the about box as showable or not.
   *
   * @param {boolean} shouldShow The desired state
   * @returns {void} Nothing
   * @memberof UiStore
   */
  onToggleAbout(shouldShow: boolean) {
    this.setState({ aboutVisible: shouldShow });
  }

  /**
   * Mark the export box as showable or not.
   *
   * @param {boolean} shouldShow The desired state
   * @returns {void} Nothing
   * @memberof UiStore
   */
  onToggleExport(shouldShow: boolean) {
    this.setState({ exportVisible: shouldShow });
  }

  /**
   * Add a status update to be shown for a short duration.
   *
   * @param {string} status Text to display in the status bar
   * @param {number} [timeout=5000] The time to display in milliseconds
   * @returns {void} Nothing
   * @memberof UiStore
   */
  onSetTransientStatus(status: string, timeout: number = 5000) {
    this.setState({ transientStatus: status });
    if (timeout < 0) {
      return;
    }
    setTimeout(this.resetStatusLine, timeout);
  }
}
