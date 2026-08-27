import { Component } from "react";
import { AlertTriangle } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Component error:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="card m-4 p-4 border border-err/20 bg-err/5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={14} className="text-err shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="text-[12px] font-medium text-err">Something went wrong</p>
              <p className="text-[11px] text-txt-3">{this.state.error.message}</p>
              <button
                onClick={() => this.setState({ error: null, errorInfo: null })}
                className="text-[10px] text-accent hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
