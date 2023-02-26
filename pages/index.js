import Link from "next/link";
import { useEffect, useState } from "react";
import Head from "next/head";

import {
  getContract,
  getLastMessage,
  verifyMessage,
  sendMessage,
} from "../utils/contract";

import styles from "../styles/Home.module.css";

const messageConverter = (data) => ({
  user: data[0],
  message: data[1],
  timestamp: data[2],
});

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [contract, setContract] = useState();
  const [message, setMessage] = useState();
  const [userMessage, setUserMessage] = useState();

  const userMessageOnChange = (event) => {
    if (event.target.value.length > 140) {
      return;
    }

    setUserMessage(event.target.value);
  };

  const updateLastMessage = async () => {
    setLoading(true)
    const response = await getLastMessage();
    setLoading(false)
    setMessage(messageConverter(response));
  };

  const sendMessageHelper = async () => {
    setLoading(true)
    await sendMessage(userMessage);
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

  const onNewMessage = async (from, timestamp, message) => {
    console.log("NewMessage", from, timestamp, message);
    setLoading(true)
    await updateLastMessage();
    setLoading(false)
  };

  const init = async () => {
    const contract = await getContract();

    setContract(contract);
  };

  useEffect(() => {
    if (!contract) {
      return;
    }

    updateLastMessage();

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
        <title>Sign and Send a Message</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav>
        <Link href="/">Home</Link>
        <Link href="/activity">Activity</Link>
      </nav>

      <main>
        <h1 className={styles.title}>{message?.message}</h1>

        <div>
          <textarea onChange={userMessageOnChange} value={userMessage} />
          <div>
            <small>max 140 ({userMessage?.length || 0})</small>
          </div>
        </div>
        <div>
          {loading && <div>loading...</div>}
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
