import Reflux from 'reflux';

export const UiActions = Reflux.createActions({
  setScreen: {},
  setThreadVisible: {},
  toggleAbout: {},
});

export class UiStore extends Reflux.Store {
  constructor() {
    super();
    this.state = {
      aboutVisible: false,
      screenToDisplay: 0,
      threadVisible: false,
    };
    this.listenables = UiActions;
  }

  onSetScreen(number) {
    this.setState({ screenToDisplay: number });
  }

  onToggleAbout(shouldShow) {
    this.setState({ aboutVisible: shouldShow });
  }
}
