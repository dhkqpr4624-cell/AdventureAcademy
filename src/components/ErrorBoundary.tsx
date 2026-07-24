import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Adventure Academy에서 오류가 발생했습니다.", error, info);
  }

  private reloadApp = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-screen" role="alert">
          <div className="screen-panel">
            <p className="eyebrow">ERROR</p>
            <h1>모험을 불러오지 못했습니다.</h1>
            <p>페이지를 다시 불러온 뒤 한 번 더 시도해 주세요.</p>
            <button type="button" onClick={this.reloadApp}>
              다시 불러오기
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
