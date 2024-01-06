const socket = new WebSocket(`ws://${window.location.host}`); // 서버로 연결

socket.addEventListener("open", ()=>{
    console.log("Connected to Server");
})

socket.addEventListener("message", (message)=>{
    console.log("We got message : ", message.data, "from the Server");
})

socket.addEventListener("close", () => {
    console.log("Disconnected from Server");
})