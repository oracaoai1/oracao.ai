'use client';
// app/components/AudioPlayer.js
import { useState, useRef, useEffect } from 'react';
import { useAudioGeneration } from './useAudioGeneration';

function IconPlay()     { return <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>; }
function IconPause()    { return <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>; }
function IconVolume()   { return <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>; }
function IconDownload() { return <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"/></svg>; }

function WaveAnimation({ isPlaying }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'3px', height:'20px' }}>
      {[0,1,2,3,4].map(i => (
        <span key={i} style={{
          display:'block', width:'3px', borderRadius:'2px',
          background:'var(--gold-bright)',
          height: isPlaying ? undefined : '7px',
          animation: isPlaying ? `wave 1.1s ease-in-out ${i*0.12}s infinite` : 'none',
        }}/>
      ))}
      <style>{`@keyframes wave{0%,100%{height:7px}50%{height:19px}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
}

export default function AudioPlayer({ text, label = 'Ouvir esta oração', autoGenerate = false }) {
  const { status, error, audioUrl, isCached, generate, reset } = useAudioGeneration();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [current, setCurrent]     = useState(0);
  const [duration, setDuration]   = useState(0);

  useEffect(() => { if (autoGenerate && text) generate(text); }, [autoGenerate, text, generate]);

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onLoad  = () => setDuration(a.duration);
    const onTime  = () => { setCurrent(a.currentTime); setProgress((a.currentTime/a.duration)*100||0); };
    const onEnded = () => { setIsPlaying(false); setProgress(0); setCurrent(0); a.currentTime=0; };
    a.addEventListener('loadedmetadata', onLoad);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnded);
    return () => { a.removeEventListener('loadedmetadata',onLoad); a.removeEventListener('timeupdate',onTime); a.removeEventListener('ended',onEnded); };
  }, [audioUrl]);

  const toggle = async () => {
    const a = audioRef.current; if (!a) return;
    if (isPlaying) { a.pause(); setIsPlaying(false); }
    else { await a.play(); setIsPlaying(true); }
  };

  const seek = (e) => {
    const a = audioRef.current; if (!a||!duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX-r.left)/r.width)*duration;
  };

  const dl = () => { if (!audioUrl) return; const a=document.createElement('a'); a.href=audioUrl; a.download='oracao.mp3'; a.click(); };

  if (status==='idle') return (
    <button onClick={() => generate(text)} className="btn-audio-idle">
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 3a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h1v-8H4v-1a8 8 0 0 1 16 0v1h-2v8h1c1.1 0 2-.9 2-2v-7a9 9 0 0 0-9-9z"/></svg>
      {label}
    </button>
  );

  if (status==='loading') return (
    <div style={S.card}>
      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
        <div style={{width:'18px',height:'18px',borderRadius:'50%',border:'2px solid rgba(216,169,58,0.3)',borderTopColor:'var(--gold-bright)',animation:'spin .8s linear infinite',flexShrink:0}}/>
        <span style={{color:'var(--gold-bright)',fontSize:'0.88rem',fontStyle:'italic'}}>Preparando narração…</span>
      </div>
    </div>
  );

  if (status==='error') return (
    <div style={{...S.card, borderColor:'rgba(160,60,60,0.5)'}}>
      <p style={{color:'#e07070',margin:0,fontSize:'0.88rem'}}>⚠ {error}</p>
      <button onClick={() => generate(text)} style={S.smallBtn}>Tentar novamente</button>
    </div>
  );

  return (
    <div style={S.card}>
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto"/>}
      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
        <WaveAnimation isPlaying={isPlaying}/>
        <button onClick={toggle} style={S.playBtn} aria-label={isPlaying?'Pausar':'Reproduzir'}>
          {isPlaying ? <IconPause/> : <IconPlay/>}
        </button>
        <div style={{display:'flex',alignItems:'center',gap:'6px',flex:1,color:'rgba(216,169,58,0.7)'}}>
          <IconVolume/>
          <span style={{fontSize:'0.78rem',fontVariantNumeric:'tabular-nums',color:'rgba(255,255,255,0.55)'}}>
            {fmt(current)} / {fmt(duration)}
          </span>
        </div>
        {isCached && <span style={{fontSize:'0.7rem',color:'var(--gold-bright)',opacity:.7}}>⚡ instantâneo</span>}
        <button onClick={dl} style={S.iconBtn} aria-label="Baixar"><IconDownload/></button>
      </div>
      <div style={S.track} onClick={seek} role="slider">
        <div style={{...S.fill,width:`${progress}%`}}/>
        <div style={{...S.thumb,left:`calc(${progress}% - 6px)`}}/>
      </div>
      <button onClick={reset} style={S.resetBtn}>Gerar nova narração</button>
    </div>
  );
}

const S = {
  card:{background:'rgba(15,28,51,0.92)',border:'1px solid rgba(216,169,58,0.25)',borderRadius:'14px',padding:'14px 18px',display:'flex',flexDirection:'column',gap:'10px',backdropFilter:'blur(8px)',maxWidth:'460px'},
  playBtn:{width:'40px',height:'40px',borderRadius:'50%',flexShrink:0,background:'var(--gold-bright)',border:'none',color:'#2b2010',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'},
  iconBtn:{background:'transparent',border:'none',color:'rgba(216,169,58,0.6)',cursor:'pointer',padding:'4px',display:'flex',alignItems:'center',borderRadius:'6px'},
  track:{position:'relative',height:'4px',background:'rgba(216,169,58,0.15)',borderRadius:'4px',cursor:'pointer'},
  fill:{position:'absolute',inset:0,background:'linear-gradient(90deg,#b8860b,#d8a93a)',borderRadius:'4px',transition:'width .1s linear'},
  thumb:{position:'absolute',top:'-4px',width:'12px',height:'12px',borderRadius:'50%',background:'#d8a93a',boxShadow:'0 0 6px rgba(216,169,58,0.6)',transition:'left .1s linear'},
  smallBtn:{background:'transparent',border:'1px solid rgba(216,169,58,0.4)',color:'var(--gold-bright)',borderRadius:'8px',padding:'5px 12px',fontSize:'0.82rem',cursor:'pointer',alignSelf:'flex-start'},
  resetBtn:{background:'transparent',border:'none',color:'rgba(216,169,58,0.4)',fontSize:'0.75rem',cursor:'pointer',padding:0,textDecoration:'underline',alignSelf:'flex-start',textUnderlineOffset:'3px'},
};
