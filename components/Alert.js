import styles from "./Alert.module.css";

export default function Alert(props) {
  const { alert } = props;

  return (
    <div
      className={`${styles[(alert && alert[1]) || "error"]} ${styles.alert}`}
    >
      {alert && alert[0]}
    </div>
  );
}
