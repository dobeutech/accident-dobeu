import { io } from 'socket.io-client';

let socket = null;

export const initSocket = () => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000', {
    withCredentials: true, // Use cookies for auth
    transports: ['websocket', 'polling']
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

