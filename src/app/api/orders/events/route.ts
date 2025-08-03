import { NextRequest } from "next/server";
import { addConnection, removeConnection } from "@/lib/orderSSE";

export async function GET(request: NextRequest) {
    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
        start(controller) {
            // Add this connection to the set
            addConnection(controller);

            // Send initial connection message
            const welcomeMessage = `data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`;
            controller.enqueue(new TextEncoder().encode(welcomeMessage));

            // Set up heartbeat to keep connection alive
            const heartbeat = setInterval(() => {
                try {
                    const heartbeatMessage = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`;
                    controller.enqueue(new TextEncoder().encode(heartbeatMessage));
                } catch (error) {
                    clearInterval(heartbeat);
                    removeConnection(controller);
                }
            }, 30000); // Send heartbeat every 30 seconds

            // Clean up when connection closes
            request.signal.addEventListener('abort', () => {
                clearInterval(heartbeat);
                removeConnection(controller);
                controller.close();
            });
        },
        cancel() {
            // Remove connection when client disconnects
            removeConnection(this as any);
        }
    });

    // Return SSE response
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
        },
    });
}
