import { logFile } from "./speculosProxy";
import { getEnv } from "../env";
import { promiseAllBatched } from "../promise";
import { Account } from "@ledgerhq/types-live";


export const botReportFolder = async ({
  body,
  slackCommentTemplate,
  allAccountsAfter,
}: {
  body: string;
  slackCommentTemplate: string;
  allAccountsAfter: Account[];
}) => {
  await promiseAllBatched(
    getEnv("BOT_MAX_CONCURRENT"),
    [
      { title: "full-report.md", content: body },
      { title: "slack-comment-template.md", content: slackCommentTemplate },
      // { title: "before-app.json", content: makeAppJSON(allAccountsBefore) },
      // { title: "after-app.json", content: makeAppJSON(allAccountsAfter) },
    ],
    (item) => {
      return logFile(item.title, item.content);
    }
  );
  // the last two logs are kind of heavy. we probably need to compress them later
};
