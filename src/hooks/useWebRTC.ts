import { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '../store/gameStore';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:openrelay.metered.ca:80' },
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  ],
} satisfies RTCConfiguration;

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
const API_URL = import.meta.env.VITE_API_URL || '';
const HANDSHAKE_TIMEOUT = 15000;

interface WebRTCState {
  roomId: string | null;
  isHost: boolean;
  isConnected: boolean;
  error: string | null;
  errorTitle: string | null;
}

function openWs(roomId: string, playerId: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_URL}?roomId=${roomId}&playerId=${playerId}`);
    ws.onopen = () => resolve(ws);
    ws.onerror = () => reject(new Error('WebSocket connection failed'));
  });
}

function handlePeerDisconnected() {
  const store = useGameStore.getState();
  if (store.gamePhase === 'playing' || store.gamePhase === 'countdown') {
    store.setDisconnected(true);
  }
}

export function useWebRTC() {
  const [state, setState] = useState<WebRTCState>({ roomId: null, isHost: false, isConnected: false, error: null, errorTitle: null });
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const handshakeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const clearHandshakeTimer = useCallback(() => {
    if (handshakeTimerRef.current) {
      clearTimeout(handshakeTimerRef.current);
      handshakeTimerRef.current = undefined;
    }
  }, []);

  const sendMessage = useCallback((msg: unknown) => {
    if (dcRef.current?.readyState === 'open') {
      dcRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const handleDataChannelMessage = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);
      const store = useGameStore.getState();

      switch (msg.type) {
        case 'state':
          store.applyRemoteState(msg.payload);
          break;
        case 'click':
          if (store.isHost) {
            store.handleTargetClick(msg.targetId, msg.value, msg.energy, false, true, msg.targetX || 0, msg.targetY || 0);
          }
          break;
        case 'miss':
          if (!store.isHost) {
            store.addFloatingScore(msg.x, msg.y, '404', '#ff4757');
          }
          break;
        case 'ability':
          if (store.isHost) {
            store.useRemoteAbility(msg.name);
          }
          break;
        case 'notification':
          store.addNotification(msg.text);
          break;
        case 'playAgain':
          store.resetGame();
          break;
        case 'surrender':
          store.setDisconnected(true);
          break;
      }
    } catch { /* ignore malformed packets */ }
  }, []);

  const setupDataChannel = useCallback((dc: RTCDataChannel) => {
    dcRef.current = dc;
    dc.onopen = () => {
      clearHandshakeTimer();
      setState((s) => ({ ...s, isConnected: true }));
      useGameStore.getState().setSendToPeer(sendMessage);
    };
    dc.onclose = () => {
      handlePeerDisconnected();
    };
    dc.onmessage = handleDataChannelMessage;
  }, [clearHandshakeTimer, handleDataChannelMessage, sendMessage]);

  const startHandshakeTimer = useCallback(() => {
    handshakeTimerRef.current = window.setTimeout(() => {
      setState((s) => ({
        ...s,
        error: "Your firewall is stricter than 'use strict'. Try mobile data or disable your ad-blocker.",
        errorTitle: 'CORS Error (not really)',
      }));
      wsRef.current?.close();
      pcRef.current?.close();
      dcRef.current?.close();
    }, HANDSHAKE_TIMEOUT);
  }, []);

  function handleIceCandidate(msg: any) {
    const pc = pcRef.current;
    if (!pc) return;
    const candidate = JSON.parse(msg.candidate);
    if (pc.remoteDescription === null) {
      pendingCandidatesRef.current.push(candidate);
    } else {
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    }
  }

  async function drainPendingCandidates() {
    const pc = pcRef.current;
    if (!pc) return;
    const candidates = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const c of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch { /* ignore stale candidates */ }
    }
  }

  // ─── Host: create room ───────────────────────────

  const createRoom = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/rooms/create`, { method: 'POST' });
      if (!res.ok) throw new Error('Backend unreachable');
      const { roomId, hostId } = await res.json();
      setState((s) => ({ ...s, roomId, isHost: true }));

      const ws = await openWs(roomId, hostId);
      wsRef.current = ws;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;
      pendingCandidatesRef.current = [];

      const dc = pc.createDataChannel('game');
      setupDataChannel(dc);

      pc.onicecandidate = (e) => {
        if (e.candidate && ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'ice', candidate: JSON.stringify(e.candidate.toJSON()) }));
        }
      };

      useGameStore.getState().setHost(true);

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'peer_connected') {
            startHandshakeTimer();
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ws.send(JSON.stringify({ type: 'offer', sdp: JSON.stringify(offer) }));
          }
          if (msg.type === 'answer' && msg.sdp && pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(msg.sdp)));
            await drainPendingCandidates();
          }
          if (msg.type === 'ice' && msg.candidate) {
            handleIceCandidate(msg);
          }
          if (msg.type === 'peer_disconnected') {
            handlePeerDisconnected();
          }
        } catch { /* ignore */ }
      };
    } catch (err: any) {
      setState((s) => ({
        ...s,
        error: "The backend took a coffee break without telling anyone. Check your internet and try again.",
        errorTitle: 'Unhandled Promise Rejection!',
      }));
    }
  }, [setupDataChannel, startHandshakeTimer]);

  // ─── Client: join room ──────────────────────────

  const joinRoom = useCallback(async (roomId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/rooms/${roomId}/join`, { method: 'POST' });
      if (!res.ok) throw new Error('Room not found or full');
      const { playerId } = await res.json();
      setState((s) => ({ ...s, roomId, isHost: false }));

      const ws = await openWs(roomId, playerId);
      wsRef.current = ws;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;
      pendingCandidatesRef.current = [];

      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel);
      };

      pc.onicecandidate = (e) => {
        if (e.candidate && ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'ice', candidate: JSON.stringify(e.candidate.toJSON()) }));
        }
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'offer' && msg.sdp) {
            startHandshakeTimer();
            await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(msg.sdp)));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'answer', sdp: JSON.stringify(answer) }));
            await drainPendingCandidates();
          }
          if (msg.type === 'ice' && msg.candidate) {
            handleIceCandidate(msg);
          }
          if (msg.type === 'peer_disconnected') {
            handlePeerDisconnected();
          }
        } catch { /* ignore */ }
      };

      useGameStore.getState().setHost(false);
    } catch (err: any) {
      setState((s) => ({
        ...s,
        error: "That room code doesn't exist or the room is full. Maybe try 'ROOM-1'?",
        errorTitle: 'TypeError: Room is undefined.',
      }));
    }
  }, [setupDataChannel, startHandshakeTimer]);

  const disconnect = useCallback(() => {
    clearHandshakeTimer();
    wsRef.current?.close();
    wsRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    dcRef.current?.close();
    dcRef.current = null;
    setState({ roomId: null, isHost: false, isConnected: false, error: null, errorTitle: null });
  }, [clearHandshakeTimer]);

  useEffect(() => {
    return () => {
      clearHandshakeTimer();
      wsRef.current?.close();
      pcRef.current?.close();
      dcRef.current?.close();
    };
  }, [clearHandshakeTimer]);

  return { ...state, createRoom, joinRoom, sendMessage, disconnect };
}
