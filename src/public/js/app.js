// 자동으로 socket.io를 사용하는 서버를 찾으며 재연결 기능 포함
const socket = io();

// ----------------------- 비디오 -------------------------- //
const myFace = document.querySelector("#myFace");
const muteBtn = document.querySelector("#mute");
const cameraBtn = document.querySelector("#camera");
const camerasSelect = document.querySelector("#cameras");
const audiosSelect = document.querySelector("#audios");
const peerFace = document.querySelector("#peerFace");

let muted = false;
let cameraOff = false;

let myStream;

//RTC peer
let myPeerConnection;

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

async function showRoom(){
    welcome.hidden = true;
    room.hidden = false;

    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    const msgForm = room.querySelector("#msg");
    // const nameForm = room.querySelector("#name");
    msgForm.addEventListener("submit", handleMessageSubmit);
    // nameForm.addEventListener("submit", handleNicknameSubmit);

    // RTC peer 연결
    await getMedia()
    .then(()=>{makeConnection();});

}

let roomName;

async function handleRoomSubmit(event){
    event.preventDefault();
    const nick = form.querySelector("#nick");
    const room = form.querySelector("#roomName");
    roomName = room.value;
    await showRoom();
    /*
        이벤트 정의 및 보내기 가능
        socket.io는 payload로 object를 포함한 어떤 것도 전송 가능
        개수 제한 없음
        프론트엔드에서 서버로 함수를 보낼 수 있음    
    */
    // socket.emit(event_name, payload, callback_function_call_from_server)
    socket.emit("enter_room", nick.value, room.value);
}

form.addEventListener("submit",handleRoomSubmit);

function addMessage(messages){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = messages;
    ul.appendChild(li);
}

/**
 * webRTC : peer-to-peer 방식
 *          서버에 연결되지 않고 클라이언트간 연결하여 영상/오디오/텍스트 전송
 *          서버는 시그널링 -> 각 유저의 위치 및 정보를 알려줌
 *          peer가 너무 많아지면 느려짐
 *          대신 SFU 서버를 사용하여 스트림 압축 후 전송
 */
function makeConnection(){
    // RTC peer 연결
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
              "stun:stun2.l.google.com:19302",
              "stun:stun3.l.google.com:19302",
              "stun:stun4.l.google.com:19302",
            ],
          },
        ],
    });

    // peer 간 양쪽에서 description을 모두 받은 경우 iceCandidate 이벤트 발생
    // webRTC에 필요한 프로토콜 생성
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("track", handleAddStream);
    
    // stream 추가
    myStream.getTracks().forEach(track => {
        track.enabled = true;
        track.muted = false;
        myPeerConnection.addTrack(track, myStream);
    });
}

function handleIce(data){
    // candidate 전송
    socket.emit("ice", data.candidate, roomName);
}

// stream 출력
function handleAddStream(event) {
    peerFace.srcObject = event.streams[0];

}

// Socket
socket.on("welcome", async (user, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${user} joined`);

    // RTC 요청 초대장 생성
    const offer = await myPeerConnection.createOffer();

    // 초대장 실어 나르기
    myPeerConnection.setLocalDescription(offer);

    console.log("send the offer");
    // 초대장 보내기
    socket.emit("offer", offer, roomName);
    
})

// 서버는 초대장을 해당 방으로 전송
socket.on("offer",  async (offer) => {
    console.log("received the offer");
    // 상대의 정보 생성
    myPeerConnection.setRemoteDescription(offer);

    //answer 생성
    const answer = await myPeerConnection.createAnswer();

    myPeerConnection.setLocalDescription(answer);

    console.log("send the answer");
    socket.emit("answer", answer, roomName);
})

// answer 받음
socket.on("answer", answer => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
})

socket.on("ice", ice => {
    console.log("received the candidate");
    // candidate 설정
    myPeerConnection.addIceCandidate(ice);
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
    const initialConstraints = {
        audio : true,
        video : { facingMode : "user" },
    };

    const cameraConstraints = {
        audio : { deviceId : { exact : audioDeviceId } },
        video : { deviceId : { exact : videoDeviceId } }
    }

    try {
        // 유저 미디어 장치 가져오기
        myStream = await navigator.mediaDevices.getUserMedia(
            (videoDeviceId||audioDeviceId) ? cameraConstraints : initialConstraints
        );
        console.log("mystream connected" , myStream);
        myFace.srcObject = myStream;
        if(!videoDeviceId && !audioDeviceId){
            await getMedias();
        }
    } catch(e){
        console.log(e);
    }
}

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
    if(myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];
        const audioTrack = myStream.getAudioTracks()[0];
        
        const videoSender = myPeerConnection
            .getSenders()
            .find(sender => sender.track.kind === "video");
        const audioSender = myPeerConnection
            .getSenders()
            .find(sender => sender.track.kind === "audio");
        
        // track 변경
        videoSender.replaceTrack(videoTrack);
        audioSender.replaceTrack(audioTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleMediaChange);
audiosSelect.addEventListener("input", handleMediaChange);
