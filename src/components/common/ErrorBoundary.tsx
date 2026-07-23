import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React Error Boundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Oops! Algo deu errado ao carregar
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ocorreu um erro inesperado na interface. Clique abaixo para reiniciar a aplicação em um estado seguro.
            </p>
            {this.state.error && (
              <div className="bg-slate-100 p-3 rounded-xl text-left font-mono text-[11px] text-slate-700 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Recarregar Aplicação</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
