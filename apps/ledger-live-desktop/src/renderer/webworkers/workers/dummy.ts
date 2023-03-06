import lodash from "lodash";

onmessage = (e: MessageEvent<Array<number>>) => {
  console.log("Message received from main script: ", e.data);
  const workerResult = lodash.floor(e.data[0] * e.data[1]);
  console.log("Posting message back to main script: " + workerResult);
  postMessage(workerResult);
};
