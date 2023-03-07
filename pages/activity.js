import { useEffect, useState } from "react";
import Head from "next/head";

import Menu from "../components/Menu";
import Loading from "../components/Loading";
import Alert from "../components/Alert";

import {
  networkURL,
  contractAddress,
  shortSha,
  getContract,
  getActivity,
} from "../utils/contract";

import styles from "../styles/Main.module.css";

export default function Activity() {
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState();
  const [activity, setActivity] = useState([]);
  const [alert, setAlert] = useState();

  const getActivityHelper = async () => {
    setLoading(true);

    const response = await getActivity();
    setActivity(response);

    setLoading(false);
  };

  const init = async () => {
    if (!window.ethereum) {
      setAlert(["Please install MetaMask", "error"]);
      return;
    }

    await getActivityHelper();

    const contract = await getContract();
    setContract(contract);
  };

  const onNewMessage = async () => {
    await getActivityHelper();

    setLoading(false);
  };

  useEffect(() => {
    if (!contract) {
      return;
    }

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
        <title>Activity</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Menu />

      <main className={styles.main}>
        <h1>
          <a href={`${networkURL}/address/${contractAddress}`} target="_blank">
            Contract Activity 🔗
          </a>
        </h1>

        <Alert alert={alert} />

        {activity.map((item, index) => {
          return (
            <div key={index} className={styles.message}>
              <strong>{item.message}</strong>

              <a href={`${networkURL}/address/${item.user}`} target="_blank">
                {shortSha(item.user)} 🔗
              </a>

              <small>{item.date.toLocaleString()}</small>
            </div>
          );
        })}
      </main>

      <Loading loading={loading} />
    </div>
  );
}
