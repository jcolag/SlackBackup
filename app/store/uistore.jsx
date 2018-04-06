import Reflux from 'reflux';

export const UiActions = Reflux.createActions({
  setScreen: {},
  toggleAbout: {},
});

export class UiStore extends Reflux.Store {
  constructor() {
    super();
    this.state = {
      aboutVisible: false,
      screenToDisplay: 0,
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
