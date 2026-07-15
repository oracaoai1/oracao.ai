'use client';
// app/components/AudioPlayerWrapper.js
// Wrapper client-side necessário para usar AudioPlayer em Server Components.
import AudioPlayer from './AudioPlayer';

export default function AudioPlayerWrapper({ text, label, loopReference }) {
  return (
    <AudioPlayer
      text={text}
      label={label || 'Ouvir esta oração'}
      loopReference={loopReference}
    />
  );
}
