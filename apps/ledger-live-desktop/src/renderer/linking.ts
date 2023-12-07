import electron from "electron";
let shell: Electron.Shell | undefined;
if (!process.env.STORYBOOK_ENV) {
  shell = electron.shell;
}
export const openURL = (url: string, customEventName = "OpenURL", extraParams: object = {}) => {
  shell && shell.openExternal(url);
};
