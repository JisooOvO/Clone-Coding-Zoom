// 자동으로 socket.io를 사용하는 서버를 찾으며 재연결 기능 포함
const socket = io();

const welcome = document.querySelector("#welcome");
const form = welcome.querySelector("form");

const room = document.querySelector("#room");
room.hidden = true;

function handleMessageSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const text = input.value;
    socket.emit("new_message" , text, roomName, ()=> {
        addMessage(`You : ${text}`);
    });
    input.value = "";
}

// function handleNicknameSubmit(event){
//     event.preventDefault();
//     const input = room.querySelector("#name input");
//     socket.emit("nickname" , input.value);
// }

function showRoom(){
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    const msgForm = room.querySelector("#msg");
    // const nameForm = room.querySelector("#name");
    msgForm.addEventListener("submit", handleMessageSubmit);
    // nameForm.addEventListener("submit", handleNicknameSubmit);
}

let roomName;

function handleRoomSubmit(event){
    event.preventDefault();
    const nick = form.querySelector("#nick");
    const room = form.querySelector("#roomName");

    /*
        이벤트 정의 및 보내기 가능
        socket.io는 payload로 object를 포함한 어떤 것도 전송 가능
        개수 제한 없음
        프론트엔드에서 서버로 함수를 보낼 수 있음    
    */
    // socket.emit(event_name, payload, callback_function_call_from_server)
    socket.emit("enter_room", nick.value, room.value, showRoom);
    roomName = room.value;
}

form.addEventListener("submit",handleRoomSubmit);

function addMessage(messages){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = messages;
    ul.appendChild(li);
}

socket.on("welcome", (user, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${user} joined`);
})

socket.on("bye", (user, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;    
    addMessage(`${user} left`);
})

socket.on("new_message", addMessage);

// (msg) => console.log(msg) ==
socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerText = "";

    rooms.forEach(room => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    });
});