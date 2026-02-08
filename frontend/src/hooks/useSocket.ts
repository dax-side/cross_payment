import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

export function useSocket(userId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      socket.emit('join', userId);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  const onTransactionUpdate = useCallback(
    (handler: (data: any) => void) => {
      const socket = socketRef.current;
      if (!socket) return () => {};
      socket.on('transaction:update', handler);
      return () => {
        socket.off('transaction:update', handler);
      };
    },
    []
  );

  const onBalanceUpdate = useCallback(
    (handler: (data: any) => void) => {
      const socket = socketRef.current;
      if (!socket) return () => {};
      socket.on('balance:update', handler);
      return () => {
        socket.off('balance:update', handler);
      };
    },
    []
  );

  return { onTransactionUpdate, onBalanceUpdate };
}
