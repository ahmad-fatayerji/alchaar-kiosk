// Store active connections
const connections = new Set<ReadableStreamDefaultController>();

// Function to broadcast order updates to all connected clients
export function broadcastOrderUpdate(orderData: any) {
    const message = `data: ${JSON.stringify(orderData)}\n\n`;

    // Send to all connected clients
    connections.forEach((controller) => {
        try {
            controller.enqueue(new TextEncoder().encode(message));
        } catch (error) {
            // Remove broken connections
            connections.delete(controller);
        }
    });
}

// Function to add a new connection
export function addConnection(controller: ReadableStreamDefaultController) {
    connections.add(controller);
}

// Function to remove a connection
export function removeConnection(controller: ReadableStreamDefaultController) {
    connections.delete(controller);
}

// Function to get the number of active connections
export function getConnectionCount() {
    return connections.size;
}
