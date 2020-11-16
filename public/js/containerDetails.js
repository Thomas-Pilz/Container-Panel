const socketProtocol = (window.location.protocol === 'https:' ? 'wss:' : 'ws:')
const serverSocketUrl = socketProtocol + "//" + window.location.hostname + ":" + window.location.port + window.location.pathname
const socket = new WebSocket(serverSocketUrl);

socket.onopen = e => {
    console.log(`connection to ${serverSocketUrl} established.`);
    socket.send("Please send data.");
}

socket.onmessage = e => {
    runtimeInfo = JSON.parse(e.data);
    console.log(runtimeInfo);
};