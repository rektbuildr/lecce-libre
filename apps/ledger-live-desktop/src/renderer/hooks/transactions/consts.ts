export const ONEINCH_API_TOKEN = process.env.ONEINCH_API_TOKEN;
export const ONEINCH_API_BASE_URL = "https://api.1inch.dev/swap/v5.2";
export const ONEINCH_API_CLIENT_HEADERS = {
  Accept: "application/json",
  Authorization: `Bearer ${ONEINCH_API_TOKEN}`,
};

export enum TokenAddress {
  EthAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
}
