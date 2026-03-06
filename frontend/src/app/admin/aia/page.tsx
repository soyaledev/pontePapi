import { AIAClient } from './AIAClient';
import styles from '../AdminLayout.module.css';

export default function AIAPage() {
  return (
    <div className={styles.pageContent}>
      <AIAClient />
    </div>
  );
}
