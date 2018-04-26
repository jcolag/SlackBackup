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

export class UiStore extends Reflux.Store {
  constructor() {
    super();
    this.state = {
      aboutVisible: false,
      exportVisible: false,
      gutterWidth: 2,
      screenToDisplay: 0,
      threadVisible: false,
      transientStatus: '',
    };
    this.listenables = UiActions;
    this.resetStatusLine = this.onSetTransientStatus.bind(this, '', -1);
  }

  onChangeGutter(width: number) {
    this.setState({
      gutterWidth: width,
    });
  }

  onSetScreen(number: number) {
    this.setState({
      gutterWidth: 2,
      screenToDisplay: number,
      threadVisible: false,
    });
  }

  onSetThreadVisible(shouldShow: boolean = false) {
    this.setState({ threadVisible: shouldShow });
  }

  onToggleAbout(shouldShow: boolean) {
    this.setState({ aboutVisible: shouldShow });
  }

  onToggleExport(shouldShow: boolean) {
    this.setState({ exportVisible: shouldShow });
  }

  onSetTransientStatus(status: string, timeout: number = 5000) {
    this.setState({ transientStatus: status });
    if (timeout < 0) {
      return;
    }
    setTimeout(this.resetStatusLine, timeout);
  }
}
