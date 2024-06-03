import { useState, useEffect, useCallback, useRef } from 'react';

export const useWebSocket = (url, maxMessages = 100) => {
    const [status, setStatus] = useState('closed');
    const [messages, setMessages] = useState([]);
    const socketRef = useRef(null);

    useEffect(() => {
        socketRef.current = new WebSocket(url);

        const onOpen = () => setStatus('open');
        const onClose = () => setStatus('closed');
        const onError = () => setStatus('error');
        const onMessage = (event) => {
            setMessages(prevMessages => {
                const newMessages = [...prevMessages, event.data];
                return newMessages.slice(-maxMessages);
            });
        };

        // Adding event listeners
        socketRef.current.addEventListener('open', onOpen);
        socketRef.current.addEventListener('close', onClose);
        socketRef.current.addEventListener('error', onError);
        socketRef.current.addEventListener('message', onMessage);

        return () => {
            // Removing event listeners and closing the WebSocket
            socketRef.current.removeEventListener('open', onOpen);
            socketRef.current.removeEventListener('close', onClose);
            socketRef.current.removeEventListener('error', onError);
            socketRef.current.removeEventListener('message', onMessage);
            socketRef.current.close();
        };
    }, [url, maxMessages]);

    const sendMessage = useCallback((message) => {
        if (socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(message);
        }
    }, []);

    return { 
      websocketStatus: status, 
      websocketMessages: messages, 
      sendWS: sendMessage };
}
