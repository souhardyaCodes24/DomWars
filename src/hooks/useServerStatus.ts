import { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';
const CHECK_INTERVAL = 2000;

const MESSAGES = [
  'Waking up the server...',
  'Poking the DOM server with a stick...',
  'The server is brewing coffee...',
  'Ringing the server like a dinner bell...',
  'Server is doing its morning stretches...',
  'Alarm! Server wake-up call...',
  'Server is still dreaming of 1s and 0s...',
  'Gently nudging the server...',
  'Server loading: 0xZzz...',
  'Shouting "HELLO?" into the server void...',
];

let msgIndex = 0;
function nextMessage() {
  const msg = MESSAGES[msgIndex % MESSAGES.length];
  msgIndex++;
  return msg;
}

export function useServerStatus() {
  const [isReady, setIsReady] = useState(false);
  const [message, setMessage] = useState(MESSAGES[0]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (isReady) return;

    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/api/health`);
        if (res.ok) {
          setIsReady(true);
          clearInterval(intervalRef.current);
        }
      } catch {
        setMessage(nextMessage());
      }
    };

    check();
    intervalRef.current = setInterval(check, CHECK_INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [isReady]);

  return { isServerReady: isReady, message };
}
