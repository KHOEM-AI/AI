import { Component, type ReactNode } from "react";
import { useBackClose } from "../lib/useBackClose";

// Phone Back button closes the open panel (instead of leaving the app)
function Guard({ onClose }: { onClose: () => void }) { useBackClose(onClose); return null; }
function BackGuard({ onClose }: { onClose?: () => void }) { return onClose ? <Guard onClose={onClose} /> : null; }

interface Props { children: ReactNode; onClose?: () => void }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    return (<><BackGuard onClose={this.props.onClose} />{this.renderInner()}</>);
  }

  renderInner() {
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
