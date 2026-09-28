import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; onClose?: () => void }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="status-overlay" role="dialog">
          <div className="status-panel">
            <div className="status-panel__head">
              <div className="status-panel__ai-name">មានបញ្ហា (Error)</div>
              {this.props.onClose && (
                <button className="status-panel__close" onClick={this.props.onClose}>✕</button>
              )}
            </div>
            <p className="status-card__err">{this.state.error.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
