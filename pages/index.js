import { useEffect, useState } from "react";
import Head from "next/head";

import Menu from "../components/Menu";
import Loading from "../components/Loading";
import {
  getContract,
  getLastMessage,
  verifyMessage,
  sendMessage,
} from "../utils/contract";

import styles from "../styles/Main.module.css";

const MAX_LENGTH = 140;

const messageConverter = (data) => ({
  user: data[0],
  message: data[1],
  timestamp: data[2],
});

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState();
  const [message, setMessage] = useState();
  const [userMessage, setUserMessage] = useState();
  const [alert, setAlert] = useState();

  const updateLastMessage = async () => {
    setLoading(true);

    const response = await getLastMessage();
    setLoading(false);

    setMessage(messageConverter(response));
  };

  const sendMessageHelper = async () => {
    setLoading(true);
    setAlert(["hold tight, sending data to blockchain :)", "warning"])
    await sendMessage(userMessage);
    await setUserMessage("");
    setAlert(["message sent!", "success"])
  };

  const isMessageEmpty = () => {
    setAlert();
    if (!userMessage) {
      setAlert(["message empty"]);
    }

    return !userMessage;
  };

  const signMessageClickHandler = async () => {
    if (isMessageEmpty()) {
      return;
    }

    try {
      const signature = await verifyMessage(userMessage);
      setAlert([`Message signed: ${signature}`, "success"]);
    } catch (error) {
      setAlert(["an error happened, please try again later"]);
      console.log(error);
      return;
    }
  };

  const sendMessageClickHandler = async () => {
    if (isMessageEmpty()) {
      return;
    }

    try {
      await sendMessageHelper();
    } catch (error) {
      setLoading(false);
      setAlert(["an error happened, please try again later"]);
      console.log(error);
    }
  };

  const signAndSendMessageClickHandler = async () => {
    if (isMessageEmpty()) {
      return;
    }

    try {
      await verifyMessage(userMessage);
      await sendMessageHelper();
    } catch (error) {
      setAlert(["an error happened, please try again later"]);
      console.log(error);
    }
  };

  const onUserMessageChange = (event) => {
    if (event.target.value.length > MAX_LENGTH) {
      return;
    }

    setUserMessage(event.target.value);
  };

  const onNewMessage = async (from, timestamp, message) => {
    console.log("NewMessage", from, timestamp, message);

    await updateLastMessage();
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

      <Menu />

      <main className={styles.main}>
        <h1 className={styles.banner}>{message?.message || "..."}</h1>

        <textarea
          className={styles.messageInput}
          onChange={onUserMessageChange}
          value={userMessage}
          maxLength={MAX_LENGTH}
          placeholder={"say something to the world ^.^"}
        />

        <div className={styles.limitLength}>
          max 140 ({userMessage?.length || 0})
        </div>

        <div className={styles.control}>
          <button onClick={signMessageClickHandler}>Sign</button>
          <button onClick={sendMessageClickHandler}>Send Message</button>
          <button onClick={signAndSendMessageClickHandler}>
            Sign and send
          </button>
        </div>

        <div
          className={`${styles[alert && alert[1] || "error"]} ${
            styles.alert
          }`}
        >
          {alert && alert[0]}
        </div>
      </main>

      <Loading loading={loading} />
    </div>
  );
}
