'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // ✅ Исправлено: передаём errorInfo как строку или отдельно
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack || 'Нет данных',
      },
    });
    console.error('❌ ErrorBoundary поймал ошибку:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-xl font-bold text-gray-800">Что-то пошло не так</h2>
            <p className="text-gray-500 mt-2">Мы уже работаем над исправлением</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}