const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

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
  const accounts = await ethereum.request({ method: "eth_requestAccounts" });

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
  web3.currentProvider.sendAsync(
    {
      method,
      params,
      from,
    },
    async function (err, result) {
      if (err) {
        console.dir(err);
        return;
      }

      if (result.error) {
        console.dir(result.error.message);
        return;
      }

      let { result: sign } = result;
      console.log("EthSignTyped SIGNED:" + JSON.stringify(sign));

      const recovered = recoverTypedSignature({
        data: msgParams,
        signature: result.result,
        version: "V1",
      });

      if (toChecksumAddress(recovered) !== toChecksumAddress(from)) {
        console.log(
          "Failed to verify signer when comparing " + result + " to " + from
        );
        return;
      }

      console.log("!!Successfully recovered signer as " + from);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      const response = await contract.verifyAddressFromTypedSign(
        sign,
        message,
        from
      );
      console.log({ response });

      const msg = await contract.getLastMessage();
      console.log({ msg });
    }
  );
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

  const clickHandler = async () => {
    await verifyMessage(userMessage).catch((error) => console.log(error));
  };

  const onNewMessage = (from, timestamp, message) => {
    console.log("NewMessage", from, timestamp, message);
  };

  const userMessageOnChange = (event) => {
    setUserMessage(event.target.value);
  };

  const getLastMessage = async () => {
    if (!contract) {
      return;
    }

    const response = await contract.getLastMessage();
    setMessage(messageConverter(response));
  };

  const sendMessageClickHandler = async () => {
    await sendMessage(userMessage)
      .catch((error) => console.log(error))
      .then(() => getLastMessage())
      .then(() => setUserMessage(""));
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
          <button onClick={clickHandler}>Sign V1</button>
          <button onClick={sendMessageClickHandler}>Send Message</button>
        </p>
      </main>

      <footer>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <img src="/vercel.svg" alt="Vercel" className={styles.logo} />
        </a>
      </footer>

      <style jsx>{`
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        footer img {
          margin-left: 0.5rem;
        }
        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          color: inherit;
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
