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

const sendMessage = async () => {
  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  console.log({ accounts });

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  console.log({ provider, signer });
  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  console.log({ contract, signer });

  const msg = await contract.getMessage();
  console.log({ msg });

  const txn = await contract.sendMessage("cool!");
  console.log("Mining...", txn.hash);

  await txn.wait();
  console.log("Mined -- ", txn.hash);
};

const signMessageV4 = async () => {
  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  console.log({ accounts });

  const msgParams = JSON.stringify({
    domain: {
      chainId: 5,
      name: "Message Example",
      verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
      version: "1",
    },
    message: {
      contents: "Hello, Bob!",
    },
    primaryType: "Message",
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Message: [{ name: "contents", type: "string" }],
    },
  });

  const from = accounts[0];

  const params = [from, msgParams];
  const method = "eth_signTypedData_v4";

  web3.currentProvider.sendAsync(
    {
      method,
      params,
      from,
    },
    async function (err, result) {
      if (err) return console.dir(err);
      if (result.error) {
        alert(result.error.message);
      }
      if (result.error) return console.error("ERROR", result);
      console.log({ result });
      console.log("TYPED SIGNED:" + JSON.stringify(result.result));

      const recovered = recoverTypedSignature({
        data: JSON.parse(msgParams),
        signature: result.result,
        version: "V4",
      });

      const signature = result.result.substring(2);
      const r = "0x" + signature.substring(0, 64);
      const s = "0x" + signature.substring(64, 128);
      const v = parseInt(signature.substring(128, 130), 16);
      console.log({ signature, r, s, v });

      if (toChecksumAddress(recovered) === toChecksumAddress(from)) {
        console.log("Successfully recovered signer as " + from);
      } else {
        console.log(
          "Failed to verify signer when comparing " + result + " to " + from
        );
      }
    }
  );
};

const verifyMessage = async () => {
  const msg1 = "heeeyyyy!";
  const num1 = 46;
  const msgParams = [
    {
      type: "string",
      name: "Message",
      value: msg1,
    },
    {
      type: "uint256",
      name: "num",
      value: num1,
    },
  ];

  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  console.log({ accounts });
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
      if (err) return console.dir(err);
      if (result.error) {
        alert(result.error.message);
      }
      let sign = result.result;
      console.log("EthSignTyped SIGNED:" + JSON.stringify(sign));

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      console.log({ provider, signer });
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      console.log({ sign, msg1, num1, from });

      const response = await contract.verifyAddressFromTypedSign(
        sign,
        msg1,
        num1,
        from
      );
      console.log({ response });

      const msg = await contract.getMessage();
      console.log({ msg });
    }
  );
};

export default function Home() {
  const [contract, setContract] = useState();

  const clickHandler = async () => {
    // const flag = "send_message";
    const flag = "verify_message";

    if (flag === "send_message") {
      await sendMessage().catch((error) => console.log(error));

      return;
    }

    if (flag === "verify_message") {
      await verifyMessage().catch((error) => console.log(error));

      return;
    }

    if (flag === "sign_message_v4") {
      await signMessageV4();

      return;
    }
  };

  const onNewMessage = (from, timestamp, message) => {
    console.log("NewMessage", from, timestamp, message);
  };

  const init = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);

    const signer = await provider.getSigner();
    console.log({ signer });
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    setContract(contract);
  };

  useEffect(() => {
    if (!contract) {
      return;
    }

    contract.on("NewMessage", onNewMessage);
    return () => {
      console.log('out cool!')
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
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <p className={styles.description}>
          <button onClick={clickHandler}>Sign</button>
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
