export type MessageTypes =
  | "transport:open"
  | "transport:exchange"
  | "transport:exchangeBulk"
  | "transport:exchangeBulk:unsubscribe"
  | "transport:listen"
  | "transport:listen:unsubscribe"
  | "transport:close"
  | "sentryLogsChanged"
  | "set-sentry-tags"
  | "internalCrashTest"
  | "setEnv";

export type MessagesMap = {
  "transport:open": {
    data: { descriptor: string };
    requestId: string;
  };
  "transport:exchange": {
    data: { descriptor: string; apduHex: string };
    requestId: string;
  };
  "transport:exchangeBulk": {
    data: { descriptor: string; apdusHex: string[] };
    requestId: string;
  };
  "transport:exchangeBulk:unsubscribe": {
    data: { descriptor: string };
    requestId: string;
  };
  "transport:listen": {
    requestId: string;
  };
  "transport:listen:unsubscribe": {
    requestId: string;
  };
  "transport:close": {
    data: { descriptor: string };
    requestId: string;
  };
  sentryLogsChanged: {
    payload: boolean;
  };
  "set-sentry-tags": {
    tagsJSON: string;
  };
  internalCrashTest: {};
  setEnv: { env: { name: string; value: unknown } };
};

export type Message = {
  [K in keyof MessagesMap]: { type: K } & MessagesMap[K];
}[keyof MessagesMap];
