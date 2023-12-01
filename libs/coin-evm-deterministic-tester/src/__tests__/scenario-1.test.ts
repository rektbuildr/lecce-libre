import { ethers } from "ethers";
import { BigNumber } from "bignumber.js";
import { EthereumLikeInfo } from "@ledgerhq/types-cryptoassets";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { provider, ethereum, ERC20Interface, USDC } from "../helpers";
import { getLogs, setBlock } from "../indexer";
import { Scenario, execute } from "../engine";

const scenario: Scenario = {
  currency: {
    ...ethereum,
    ethereumLikeInfo: {
      ...ethereum.ethereumLikeInfo,
      node: {
        type: "external",
        uri: "http://127.0.0.1:8545",
      },
    } as EthereumLikeInfo,
  },
  nanoApp: { firmware: "2.1.0", version: "1.10.3" },
  beforeTransactions: async (address: string) => {
    await setBlock();

    const addressToImpersonate = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503"; // Binance
    await provider.send("anvil_impersonateAccount", [addressToImpersonate]);

    const sendUSDC = {
      from: addressToImpersonate,
      to: USDC.contractAddress,
      data: ERC20Interface.encodeFunctionData("transfer", [
        address,
        ethers.utils.parseUnits("100", USDC.units[0].magnitude),
      ]),
      value: ethers.BigNumber.from(0).toHexString(),
      gas: ethers.BigNumber.from(1_000_000).toHexString(),
      type: "0x0",
      gasPrice: (await provider.getGasPrice()).toHexString(),
      nonce: "0x" + (await provider.getTransactionCount(addressToImpersonate)).toString(16),
      chainId: "0x" + (await provider.getNetwork()).chainId.toString(16),
    };

    const hash = await provider.send("eth_sendTransaction", [sendUSDC]);
    await provider.send("anvil_stopImpersonatingAccount", [addressToImpersonate]);

    await provider.waitForTransaction(hash);
    await getLogs();
  },
  transactions: [
    // {
    //   amount: new BigNumber(ethers.utils.parseEther("1").toString()),
    //   recipient: ethers.constants.AddressZero,
    // },
    // {
    //   amount: new BigNumber(ethers.utils.parseEther("10").toString()),
    //   recipient: ethers.constants.AddressZero,
    // },
    {
      recipient: "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503", // Random Receiver
      amount: new BigNumber(ethers.utils.parseUnits("100", USDC.units[0].magnitude).toString()),
      subAccountId: encodeTokenAccountId(
        "js:2:ethereum:0x2FBde3Ac8F867e5ED06e4C7060d0df00D87E2C35:",
        USDC,
      ),
    },
    // {
    //   recipient: "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503", // Random Receiver
    //   amount: new BigNumber(ethers.utils.parseUnits("100", 6).toString()),
    // subAccountId: encodeTokenAccountId(
    //   "js:2:ethereum:0x2FBde3Ac8F867e5ED06e4C7060d0df00D87E2C35:",
    //   USDC,
    // ),
    // customGasLimit: new BigNumber(1_000_000), // Prevents the failure of simulation
    // },
  ],
};

describe("A", () => {
  it("should work", async () => {
    try {
      await execute(scenario);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
