import { utils, providers, ethers } from "ethers";
import { LedgerExplorerOperation } from "@ledgerhq/coin-evm/lib/types/index";
import ERC20ABI from "./abis/erc20.json";
import ERC721ABI from "./abis/erc721.json";
import ERC1155ABI from "./abis/erc1155.json";
import { provider } from "./helpers";

const ERC20Interface = new utils.Interface(ERC20ABI);
const ERC721Interface = new utils.Interface(ERC721ABI);
const ERC1155Interface = new utils.Interface(ERC1155ABI);

const TRANSFER_EVENTS_TOPICS = {
  ERC20: ERC20Interface.getEventTopic("Transfer"),
  ERC721: ERC721Interface.getEventTopic("Transfer"),
  ERC1155: ERC1155Interface.getEventTopic("TransferSingle"),
};

let fromBlock: number;
export const setBlock = async () => {
  fromBlock = await provider.getBlockNumber();
};

const explorerAppendixByAddress: Record<string, LedgerExplorerOperation[]> = {};
export const getLogs = async (): Promise<providers.Log[]> => {
  if (!fromBlock) {
    await setBlock();
  }

  console.log("FROM BLOCK", fromBlock);
  const toBlock = await provider.getBlockNumber();
  console.log("TO BLOCK", toBlock);
  const logs = await provider.getLogs({
    fromBlock,
    toBlock,
    topics: [TRANSFER_EVENTS_TOPICS.ERC20],
  });

  if (logs.length) {
    for (const log of logs) {
      const [receipt, tx, block, contractDecimals] = await Promise.all([
        provider.getTransactionReceipt(log.transactionHash),
        provider.getTransaction(log.transactionHash),
        provider.getBlock(log.blockHash),
        provider
          .call({ to: log.address, data: ERC20Interface.encodeFunctionData("decimals") })
          .then(res => (!res || res === "0x" ? false : true)),
      ]);

      const isERC20 = log.topics[0] === TRANSFER_EVENTS_TOPICS.ERC20 && contractDecimals;
      const isERC721 = log.topics[0] === TRANSFER_EVENTS_TOPICS.ERC721 && !contractDecimals;
      const isERC1155 = log.topics[0] === TRANSFER_EVENTS_TOPICS.ERC1155;

      const operation: LedgerExplorerOperation = {
        hash: log.transactionHash,
        transaction_type: receipt.type,
        nonce: "",
        nonce_value: -1,
        value: tx.value.toString(),
        gas: tx.gasLimit.toString(),
        gas_price: receipt.effectiveGasPrice.toString(),
        max_fee_per_gas: tx.type === 2 ? tx.maxFeePerGas!.toString() : null,
        max_priority_fee_per_gas: tx.type === 2 ? tx.maxPriorityFeePerGas!.toString() : null,
        from: tx.from,
        to: tx.to!,
        transfer_events: isERC20
          ? [
              {
                contract: log.address,
                count: ethers.BigNumber.from(log.data).toString(),
                from: ethers.utils.defaultAbiCoder.decode(["address"], log.topics[1])[0],
                to: ethers.utils.defaultAbiCoder.decode(["address"], log.topics[2])[0],
              },
            ]
          : [],
        erc721_transfer_events: isERC721
          ? [
              {
                contract: log.address,
                token_id: ethers.BigNumber.from(log.data).toString(),
                sender: ethers.utils.defaultAbiCoder.decode(["address"], log.topics[1])[0],
                receiver: ethers.utils.defaultAbiCoder.decode(["address"], log.topics[2])[0],
              },
            ]
          : [],
        erc1155_transfer_events: isERC1155
          ? [
              // TODO
            ]
          : [],
        approval_events: [],
        actions: [],
        confirmations: tx.confirmations,
        input: null,
        gas_used: receipt.gasUsed.toString(),
        cumulative_gas_used: receipt.cumulativeGasUsed.toString(),
        status: receipt.status!,
        received_at: block.timestamp.toString(),
        block: {
          hash: log.blockHash,
          height: log.blockNumber,
          time: block.timestamp.toString(),
        },
      };

      const from = isERC20 || isERC721 ? log.topics[1] : log.topics[2];
      const to = isERC20 || isERC721 ? log.topics[2] : log.topics[3];
      if (!explorerAppendixByAddress[from]) {
        explorerAppendixByAddress[from] = [];
      }
      explorerAppendixByAddress[from].push(operation);
      if (!explorerAppendixByAddress[to]) {
        explorerAppendixByAddress[to] = [];
      }
      explorerAppendixByAddress[to].push(operation);

      fromBlock = log.blockNumber;
    }
  }

  return logs;
};
