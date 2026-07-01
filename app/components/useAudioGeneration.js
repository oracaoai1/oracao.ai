'use client';
// app/components/useAudioGeneration.js
import { useState, useRef, useCallback } from 'react';

export function useAudioGeneration() {
  const [status,   setStatus]   = useState('idle');
  const [error,    setError]    = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const blobRef = useRef(null);

  const generate = useCallback(async (text) => {
    if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = null; }
    setStatus('loading'); setError(null); setAudioUrl(null); setIsCached(false);
    try {
      const res = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Não foi possível gerar o áudio.');
      }
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const data = await res.json();
        setAudioUrl(data.url);
        setIsCached(data.cached === true);
      } else {
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        blobRef.current = url;
        setAudioUrl(url);
      }
      setStatus('ready');
    } catch (e) { setError(e.message); setStatus('error'); }
  }, []);

  const reset = useCallback(() => {
    if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = null; }
    setAudioUrl(null); setStatus('idle'); setError(null); setIsCached(false);
  }, []);

  return { status, error, audioUrl, isCached, generate, reset };
}
