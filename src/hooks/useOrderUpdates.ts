import { useEffect, useState, useCallback } from 'react';

type OrderUpdate = {
    type: 'new_order' | 'order_updated' | 'order_fulfilled' | 'connected' | 'heartbeat';
    order?: any;
    orderId?: number;
    orderNumber?: string;
    date?: string;
    message?: string;
    timestamp?: number;
};

export function useOrderUpdates(dateFilter: string) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<OrderUpdate | null>(null);

    const handleOrderUpdate = useCallback((updateHandler: (update: OrderUpdate) => void) => {
        const eventSource = new EventSource('/api/orders/events');

        eventSource.onopen = () => {
            console.log('SSE connection opened');
            setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as OrderUpdate;
                setLastUpdate(data);

                if (data.type !== 'heartbeat' && data.type !== 'connected') {
                    updateHandler(data);
                }
            } catch (error) {
                console.error('Error parsing SSE data:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            setIsConnected(false);
        };

        return () => {
            eventSource.close();
            setIsConnected(false);
        };
    }, []);

    return {
        isConnected,
        lastUpdate,
        handleOrderUpdate,
    };
}
