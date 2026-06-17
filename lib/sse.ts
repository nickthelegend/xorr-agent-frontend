import { useEffect, useState, useRef, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_XORR_API || "http://localhost:8000";

interface UseSSEReturn {
  connected: boolean;
  lastMessageAt: Date | null;
  reconnect: () => void;
}

export function useSSE<T>(
  path: string,
  eventName: string,
  onMessage: (data: T) => void
): UseSSEReturn {
  const [connected, setConnected] = useState(false);
  const [lastMessageAt, setLastMessageAt] = useState<Date | null>(null);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `${API_BASE}${path}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      // Exponential backoff reconnect will be managed by simple timeout or manual reconnect
    };

    es.addEventListener(eventName, (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onMessageRef.current(parsed);
        setLastMessageAt(new Date());
      } catch (err) {
        console.error("Failed to parse SSE data:", err);
      }
    });

    return () => {
      es.close();
      setConnected(false);
    };
  }, [path, eventName]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup();
    };
  }, [connect, reconnectTrigger]);

  const reconnect = useCallback(() => {
    setReconnectTrigger((prev) => prev + 1);
  }, []);

  return { connected, lastMessageAt, reconnect };
}
