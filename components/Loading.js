import styles from "./Loading.module.css";

export default function Loading(props) {
  if (!props.loading) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.loader}></div>
    </div>
  );
}
