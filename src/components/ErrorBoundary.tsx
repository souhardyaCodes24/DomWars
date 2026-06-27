import { Component, type ReactNode } from 'react';
import { ErrorModal } from './ErrorModal';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleReload = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex items-center justify-center"
          style={{ width: '100vw', height: '100vh', background: '#fef9e7' }}
        >
          <ErrorModal
            open
            title="Fatal Exception"
            message="The game loop crashed harder than a while(true). Click below to reload and try again."
            actions={[
              { label: 'RELOAD', onClick: this.handleReload, variant: 'primary' },
            ]}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
