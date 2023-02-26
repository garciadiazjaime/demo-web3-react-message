const contractAddress = "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690";

import { useEffect, useState } from "react";
import Head from "next/head";
import { ethers } from "ethers";
import { recoverTypedSignature } from "@metamask/eth-sig-util";
const ethJSUtil = require("ethereumjs-util");

const { toChecksumAddress } = ethJSUtil;
import abi from "../utils/SignedMessage.json";

import styles from "../styles/Home.module.css";

const contractABI = abi.abi;

const sendMessage = async (message) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  const txn = await contract.sendMessage(message);
  console.log("Mining...", txn.hash);

  await txn.wait();
  console.log("Mined -- ", txn.hash);
};

const verifyMessage = async (message) => {
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

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  const response = await contract.verifyAddressFromTypedSign(
    signature,
    message,
    from
  );
  console.log(`address verified: ${response}`);
};

const messageConverter = (data) => ({
  user: data[0],
  message: data[1],
  timestamp: data[2],
});

export default function Home() {
  const [contract, setContract] = useState();
  const [message, setMessage] = useState();
  const [userMessage, setUserMessage] = useState();

  const onNewMessage = (from, timestamp, message) => {
    console.log("NewMessage", from, timestamp, message);
  };

  const userMessageOnChange = (event) => {
    setUserMessage(event.target.value);
  };

  const getLastMessage = async () => {
    if (!contract) {
      console.log("contract not defined");
      return;
    }

    const response = await contract.getLastMessage();
    setMessage(messageConverter(response));
  };

  const sendMessageHelper = async () => {
    await sendMessage(userMessage);
    await getLastMessage();
    await setUserMessage("");
  };

  const signMessageClickHandler = async () => {
    try {
      await verifyMessage(userMessage);
    } catch (error) {
      console.log(error);
    }
  };

  const sendMessageClickHandler = async () => {
    try {
      await sendMessageHelper();
    } catch (error) {
      console.log(error);
    }
  };

  const signAndSendMessageClickHandler = async () => {
    try {
      await verifyMessage(userMessage);
      await sendMessageHelper();
    } catch (error) {
      console.log(error);
    }
  };

  const init = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);

    const signer = await provider.getSigner();

    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    setContract(contract);
  };

  useEffect(() => {
    if (!contract) {
      return;
    }

    getLastMessage();

    contract.on("NewMessage", onNewMessage);
    return () => {
      contract.off("NewMessage", onNewMessage);
    };
  }, [contract]);

  useEffect(() => {
    init();
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className={styles.title}>{message && message.message}</h1>

        <div>
          <textarea onChange={userMessageOnChange} value={userMessage} />
        </div>

        <p className={styles.description}>
          <button onClick={signMessageClickHandler}>Sign V1</button>
          <button onClick={sendMessageClickHandler}>Send Message</button>
          <button onClick={signAndSendMessageClickHandler}>
            Sign and send
          </button>
        </p>
      </main>

      <style jsx>{`
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
