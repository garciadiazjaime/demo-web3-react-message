import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";

import { getContract, getActivity } from "../utils/contract";
import styles from "../styles/Home.module.css";

export default function Activity() {
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState();
  const [activity, setActivity] = useState([]);

  const getActivityHelper = async () => {
    setLoading(true);

    const response = await getActivity();
    setActivity(response);

    setLoading(false);
  }

  const init = async () => {
    await getActivityHelper()

    const contract = await getContract();
    setContract(contract);
  };

  const onNewMessage = async () => {
    await getActivityHelper()

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

      <nav>
        <Link href="/">Home</Link>
        <Link href="/activity">Activity</Link>
      </nav>

      <main>
        {loading && <div>loading...</div>}
        {activity.map((item, index) => {
          return (
            <div key={index}>
              <h2>{item.message}</h2>
              <p>from: {item.user}</p>
              <p>{item.date.toLocaleString()}</p>
            </div>
          );
        })}
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
