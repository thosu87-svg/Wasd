export function connectSocket() {
  const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${wsProtocol}//${location.host}/ws`);

  ws.onopen = () => console.log("Connected to Arelorian server");
  ws.onmessage = (msg) => console.log("Server:", msg.data);

  return ws;
}