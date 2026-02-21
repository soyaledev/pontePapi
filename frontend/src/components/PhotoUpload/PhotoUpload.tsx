'use client';

import { useId, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import styles from './PhotoUpload.module.css';

const BUCKET = 'barberias';
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type Props = {
  value: string;
  onChange: (url: string) => void;
  barbershopId?: string;
  label?: string;
};

function getExtension(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[mime] ?? 'jpg';
}

export function PhotoUpload({ value, onChange, barbershopId, label = 'Foto (portada / logo)' }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`Máximo ${MAX_SIZE_MB} MB`);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Formatos: JPG, PNG, WebP, GIF');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? 'anon';
      const ext = getExtension(file.type);
      const filename = `${crypto.randomUUID()}.${ext}`;
      const path = barbershopId ? `${uid}/${barbershopId}/${filename}` : `${uid}/${filename}`;

      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{label}</span>
      <div className={styles.row}>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={uploading}
          className={styles.hidden}
          id={id}
        />
        <label
          htmlFor={uploading ? undefined : id}
          className={`${styles.button} ${uploading ? styles.disabled : ''}`}
        >
          {uploading ? 'Subiendo...' : 'Elegir imagen'}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className={styles.remove}
          >
            Quitar
          </button>
        )}
      </div>
      {value && (
        <div className={styles.preview}>
          <img src={value} alt="Vista previa" />
        </div>
      )}
      {uploadError && <p className={styles.error}>{uploadError}</p>}
    </div>
  );
}
