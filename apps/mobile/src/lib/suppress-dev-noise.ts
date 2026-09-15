/**
 * Expo dev tools call keep-awake on Android; in Expo Go this often rejects
 * harmlessly when the screen locks during bundle load. Production builds are unaffected.
 */
const KEEP_AWAKE = /Unable to (activate|deactivate) keep awake/;

if (__DEV__) {
  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const text = args
      .map((arg) => {
        if (arg instanceof Error) return arg.message;
        return String(arg ?? "");
      })
      .join(" ");
    if (KEEP_AWAKE.test(text)) return;
    originalError(...args);
  };
}
