import * as Sentry from '@sentry/react';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${
      context ? `\nContext: ${JSON.stringify(context, null, 2)}` : ''
    }`;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const formattedMessage = this.formatMessage(level, message, context);

    // Always log to Sentry for error level
    if (level === 'error' && error) {
      Sentry.withScope((scope) => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }
        Sentry.captureException(error);
      });
    }

    // Console logging in development
    if (this.isDevelopment) {
      switch (level) {
        case 'debug':
          console.debug(formattedMessage);
          break;
        case 'info':
          console.info(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'error':
          console.error(formattedMessage);
          if (error) {
            console.error(error);
          }
          break;
      }
    }
  }

  public debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  public breadcrumb(
    message: string, 
    category?: string, 
    level: Sentry.SeverityLevel = 'info'
  ): void {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
    });
  }

  public setUser(id: string | null, email?: string): void {
    if (id) {
      Sentry.setUser({ id, email });
    } else {
      Sentry.setUser(null);
    }
  }

  public setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
  }

  public setExtra(key: string, value: unknown): void {
    Sentry.setExtra(key, value);
  }
}

export const logger = Logger.getInstance(); 