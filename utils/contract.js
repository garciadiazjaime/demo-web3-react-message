import { ethers } from "ethers";
import { recoverTypedSignature } from "@metamask/eth-sig-util";

import { toChecksumAddress } from "ethereumjs-util";

import abi from "./SignedMessage.json";

const contractABI = abi.abi;
const contractAddress = "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690";

const messageConverter = (data) => ({
  user: data[0],
  message: data[1],
  date: new Date(parseInt(data[2])),
});

export const getContract = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  return contract;
};

export const getLastMessage = async () => {
  const contract = await getContract();

  return contract.getLastMessage();
};

export const getActivity = async () => {
  const contract = await getContract();

  const response = await contract.getAllMessage();
  return response.map(messageConverter).reverse();
};

export const verifyMessage = async (message) => {
  const msgParams = [
    {
      type: "string",
      name: "Message",
      value: message,
    },
  ];

  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  const from = accounts[0];

  const params = [msgParams, from];
  const method = "eth_signTypedData";

  const signature = await ethereum.request({
    method,
    params,
    from,
  });

  console.log("EthSignTyped SIGNED:" + JSON.stringify(signature));

  const recovered = recoverTypedSignature({
    data: msgParams,
    signature,
    version: "V1",
  });

  if (toChecksumAddress(recovered) !== toChecksumAddress(from)) {
    console.log(
      "Failed to verify signer when comparing " + signature + " to " + from
    );
    return;
  }

  console.log("!!Successfully recovered signer as " + from);

  const contract = await getContract();

  const response = await contract.verifyAddressFromTypedSign(
    signature,
    message,
    from
  );
  console.log(`address verified: ${response}`);
};

export const sendMessage = async (message) => {
  const contract = await getContract();

  const txn = await contract.sendMessage(message);
  console.log("Mining...", txn.hash);

  await txn.wait();
  console.log("Mined -- ", txn.hash);
};
