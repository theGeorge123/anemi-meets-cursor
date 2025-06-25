export const Validators = {
  required: (v: unknown) => !!v || 'This field is required',
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Please enter a valid email',
  minLen: (n: number) => (v: string) => !v || v.length >= n || `Min ${n} characters`,
  maxLen: (n: number) => (v: string) => !v || v.length <= n || `Max ${n} characters`,
};
