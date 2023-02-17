import React from "react";
import { render } from "@testing-library/react";

import { StakeBanner } from "./StakeBanner";

// import { Account } from "@ledgerhq/types-live";

import BigNumber from "bignumber.js";
import Text from "~/renderer/components/Text";
import TargetAccountDrawer from "~/renderer/screens/exchange/Swap2/Form/TargetAccountDrawer";
import Button from "~/renderer/components/Button";

// import "@testing-library/jest-dom";
// import { userEvent } from "@testing-library/user-event";

describe("Stake Banner", () => {
  const account: Account = {
    type: "Account",
    id: "123",
    seedIdentifier: "456",
    derivationMode: "DerivationMode",
    index: 0,
    freshAddress: "123456",
    freshAddressPath: "1/2/3",
    freshAddresses: [{ address: "blah", derivationPath: "blah" }],
    name: "ethereum 1",
    starred: true,
    used: true,
    balance: new BigNumber(20),
    spendableBalance: new BigNumber(20),
    creationDate: new Date(Date.now()),
    blockHeight: 1000000,
    currency: {
      type: "CryptoCurrency",
      id: "ethereum",
      coinType: 60,
      name: "Ethereum",
      managerAppName: "Ethereum",
      ticker: "ETH",
      scheme: "ethereum",
      color: "#0ebdcd",
      symbol: "Ξ",
      units: [
        {
          name: "ether",
          code: "ETH",
          magnitude: 18,
        },
      ],
      family: "ethereum",
      blockAvgTime: 15,
      ethereumLikeInfo: {
        baseChain: "mainnet",
        chainId: 1,
        networkId: 1,
        hardfork: "london",
      },
      explorerViews: [
        {
          tx: "https://etherscan.io/tx/$hash",
          address: "https://etherscan.io/address/$address",
          token: "https://etherscan.io/token/$contractAddress?a=$address",
        },
      ],
      keywords: ["eth", "ethereum"],
      explorerId: "eth",
    },
    unit: {
      name: "ether",
      code: "ETH",
      magnitude: 18,
    },
    operationsCount: 2,
    operations: [
      {
        id: "mock_op_0_mock:1:ethereum:true_ethereum_1:",
        hash: "B83D18EB165F9D7C458A11653358CE0772C1679C2AD1FA18C0125259B8F1616E",
        type: "IN",
        senders: ["0x29BD998F3AA8FDB3CB63489CBA009CA45CAB9180"],
        recipients: ["0x45D4E12022CAD49AB739D7E6F87D91E08483E8B6"],
        accountId: "mock:1:ethereum:true_ethereum_1:",
        blockHash: "A896AC30DCEEEE6BDD92A1841E91B5EFCCD2BD083A953EA04F0DE369628765D0",
        blockHeight: 167336,
        date: new Date(Date.now()),
        value: new BigNumber(20),
        fee: new BigNumber(1),
        extra: {},
        subOperations: [],
      },
    ],
    pendingOperations: [],
    lastSyncDate: new Date(Date.now()),
    endpointConfig: null,
    subAccounts: [],
    balanceHistoryCache: {
      HOUR: {
        balances: [11310048568372697000, 11310048568372697000],
        latestDate: 1676552400000,
      },
      DAY: {
        balances: [
          11310048568372697000,
          11310048568372697000,
          11310048568372697000,
          11310048568372697000,
          11310048568372697000,
          11310048568372697000,
          11310048568372697000,
          11310048568372697000,
          11310048568372697000,
          11310048568372697000,
        ],
        latestDate: 1676502000000,
      },
      WEEK: {
        balances: [
          0,
          1234916627215822300,
          6964371504216858000,
          11310048568372697000,
          11310048568372697000,
          11310048568372697000,
        ],
        latestDate: 1676156400000,
      },
    },
    swapHistory: [],
    syncHash: "",
    nfts: [],
  };

  it("renders the Stake Banner", () => {
    // const banner = render(<StakeBanner account={account} />);
    // const banner = render(
    //   <TargetAccountDrawer
    //     accounts={account}
    //     selectedAccount={null}
    //     setToAccount={account}
    //     setDrawerStateRef={{ current: null }}
    //   />,
    // );
    // const banner = render(<Text>What up mothafuckas?</Text>);
    const banner = render(<Button>What up mothafuckas?</Button>);
  });
});
