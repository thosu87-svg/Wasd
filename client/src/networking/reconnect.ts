export function reconnectSocket(factory: () => WebSocket, maxAttempts = 5, delayMs = 2000): void {
  let attempts = 0;

  function attempt() {
    if (attempts >= maxAttempts) {
      console.error("Max reconnect attempts reached. Giving up.");
      return;
    }
    attempts++;
    console.log(`Reconnect attempt ${attempts}/${maxAttempts}...`);
    const ws = factory();
    ws.addEventListener("open", () => {
      console.log("Reconnected successfully.");
      attempts = 0;
    });
    ws.addEventListener("close", () => {
      setTimeout(attempt, delayMs);
    });
  }

  attempt();
}