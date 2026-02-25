'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { toTitleCase } from '@/lib/format';
import { supabase } from '@/lib/supabase/client';
import styles from './Hero.module.css';

type BarbershopResult = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
};

const DEBOUNCE_MS = 250;

export function Hero() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [ownerLink, setOwnerLink] = useState({ href: '/dueno/login', label: 'Soy dueño de barbería' });

  useEffect(() => {
    async function checkOwner() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setOwnerLink({ href: '/dueno/login', label: 'Soy dueño de barbería' });
        return;
      }
      const { data } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);
      if ((data?.length ?? 0) > 0) {
        setOwnerLink({ href: '/dueno/turnos', label: 'Mi panel' });
      } else {
        setOwnerLink({ href: '/dueno/login', label: 'Soy dueño de barbería' });
      }
    }
    checkOwner();
  }, []);
  const [results, setResults] = useState<BarbershopResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase.rpc('search_barbershops', {
        search_term: query.trim(),
        result_limit: 12,
      });
      setResults(data ?? []);
      setOpen(true);
      setLoading(false);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  function handleSelect(slug: string) {
    setOpen(false);
    setQuery('');
    router.push(`/barberia/${slug}`);
  }

  return (
    <section className={styles.cover}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/images/logosvgPontePapi.svg"
            alt="PontePapi"
            width={140}
            height={40}
            priority
          />
        </Link>
        <Link href={ownerLink.href} className={styles.ownerLink}>
          {ownerLink.label}
        </Link>
        </div>
      </header>
        <Image
          src="/images/portada.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.coverImage}
        />
        <div className={styles.overlay} />
        <div className={styles.searchWrapper} ref={wrapperRef}>
          <p className={styles.searchLabel}>Busca tu barbería</p>
          <div className={styles.searchBox}>
            <input
              type="search"
              placeholder="Barbería, barbero, calle o ciudad..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim() && setOpen(true)}
              className={styles.searchInput}
              autoComplete="off"
            />
            {open && (
              <ul className={styles.resultsList}>
                {loading ? (
                  <li className={styles.resultItem}>Buscando...</li>
                ) : results.length === 0 ? (
                  <li className={styles.resultItem}>Sin resultados</li>
                ) : (
                  results.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        className={styles.resultItem}
                        onClick={() => handleSelect(b.slug)}
                      >
                        <span className={styles.resultName}>{b.name}</span>
                        {b.city && <span className={styles.resultCity}>{toTitleCase(b.city)}</span>}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>
    </section>
  );
}
