'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { DuenoNav } from '@/app/dueno/DuenoNav';
import styles from './OwnerNavWrapper.module.css';

export function OwnerNavWrapper({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsOwner(false);
        return;
      }
      const { data } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);
      const hasBarbershops = (data?.length ?? 0) > 0;
      setIsOwner(hasBarbershops);
      setUserEmail(hasBarbershops ? (user.email ?? '') : null);
    }
    check();
  }, []);

  if (isOwner !== true || !userEmail) {
    return <>{children}</>;
  }

  return (
    <div className={styles.wrapper}>
      {children}
      <DuenoNav userEmail={userEmail} />
    </div>
  );
}
