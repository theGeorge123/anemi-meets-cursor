import { toast } from '../../components/use-toast';

export class ErrorService {
  static handle(error: unknown, fallback = 'Unknown error') {
    console.error('App-error:', error);
    if (typeof error === 'string') return error;
    if (error && typeof (error as { message?: string }).message === 'string')
      return (error as { message: string }).message;
    return fallback;
  }

  static toast(msg: string, type: 'success' | 'error' | 'info' = 'error') {
    const variant = type === 'error' ? 'destructive' : 'default';
    toast({ title: msg, variant });
  }

  static logError(_error: unknown, _info: unknown) {
    // Implementation of the method
  }
}
