import Link from "next/link";
import { useRouter } from "next/router";

import styles from "./Menu.module.css";

export default function Menu() {
  const router = useRouter();

  return (
    <nav className={styles.menu}>
      <Link href="/" className={router.pathname == "/" ? styles.active : ""}>Home</Link>
      <Link href="/activity" className={router.pathname == "/activity" ? styles.active : ""}>Activity</Link>
    </nav>
  );
}
