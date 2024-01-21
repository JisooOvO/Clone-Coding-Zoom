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

// ----------------------- 비디오 -------------------------- //
const myFace = document.querySelector("#myFace");
const muteBtn = document.querySelector("#mute");
const cameraBtn = document.querySelector("#camera");
const camerasSelect = document.querySelector("#cameras");
const audiosSelect = document.querySelector("#audios");

let myStream;
let muted = false;
let cameraOff = false;

async function getMedias(){
    try{
        // 사용자의 모든 장치 가져오기
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        const audios = devices.filter(device => device.kind === "audioinput");
        
        const currentCamera = myStream.getVideoTracks()[0];
        const currentAudio = myStream.getAudioTracks()[0];
        
        cameras.forEach(camera => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label == camera.label){
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        })

        audios.forEach(audio => {
            const option = document.createElement("option");
            option.value = audio.deviceId;
            option.innerText = audio.label;
            if(currentAudio.label == audio.label){
                option.selected = true;
            }
            audiosSelect.appendChild(option);            
        })
    }catch(e){
        console.log(e);
    }
}

async function getMedia(videoDeviceId, audioDeviceId){
    console.log(videoDeviceId,audioDeviceId);
    const initialConstrains = {
        audio : true,
        video : { facingMode : "user" },
    };

    const cameraConstrains = {
        audio : { deviceId : { exact : audioDeviceId } },
        video : { deviceId : { exact : videoDeviceId } }
    }

    try {
        // 유저 미디어 장치 가져오기
        myStream = await navigator.mediaDevices.getUserMedia(
            (videoDeviceId||audioDeviceId) ? cameraConstrains : initialConstrains
        );
        myFace.srcObject = myStream;

        if(!videoDeviceId && !audioDeviceId){
            await getMedias();
        }
    } catch(e){
        console.log(e);
    }
}

getMedia();

function handleMuteClick(){
    myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
    if(!muted){
        muteBtn.innerText = "Unmute";
        muted = true;
    }else{
        muteBtn.innerText = "Mute";
        muted = false;
    }
}

function handleCameraClick(){
    myStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
    if(cameraOff){
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    }else{
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

async function handleMediaChange(){
    await getMedia(camerasSelect.value, audiosSelect.value);
}


muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleMediaChange);
audiosSelect.addEventListener("input", handleMediaChange)