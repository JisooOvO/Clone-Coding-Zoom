import http from "http";
// import WebSocket from "ws";
import express from "express";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

// express 실행 -> http
const app = express();

// pug template 설정
app.set('view engine','pug');
app.set('views', __dirname + "/views");

// static 설정
app.use("/public", express.static(__dirname + "/public"));

// 라우트 설정
// Get("/") 요청시 response 렌더링 뷰 home.pug로 지정 
app.get("/", (_,res) => res.render("home"));
app.get("/*", (_,res) => res.redirect("/"));

const handleListen = () => console.log('Listening on http://localhost:3000');

// http 서버 생성
const httpServer = http.createServer(app);

// 포트 설정
httpServer.listen(3000,handleListen);

// 1. websocket 서버 생성
// const wss = new WebSocket.Server({ httpServer });

// 2. socket.io 서버 생성
const ioServer = new Server(httpServer, {
    cors: {
      origin: ["https://admin.socket.io"],
      credentials: true
    }
});

instrument(ioServer, {
    auth: false,
    mode: "development",
});

// http / ws 서버를 같은 포트에서 함께 접근 가능
// http://localhost:3000
// ws://localhost:3000

function publicRooms(){
    const {
        sockets : {
            adapter : { sids, rooms },
        },
    } = ioServer;

    const publicRooms = [];
    rooms.forEach((_,key) => {
        if(sids.get(key) === undefined){
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

function countRoom(roomName){
    return ioServer.sockets.adapter.rooms.get(roomName)?.size;
}

/*
//1. ws 를 이용하는 방법
//hrome 브라우저와 edge 브라우저가 서버와 각각의 소켓으로 연결함
//모든 연결을 관리하는 배열 생성
const sockets = [];

wss.on("connection", (socket) => {
    // socket = 연결된 브라우저
    sockets.push(socket);
    socket["nickname"] = "Anonymous";
    console.log("Connected to Browser");

    // 브라우저로 메시지 보내기
    // socket.send("hello!");

    //브라우저에서 메시지 이벤트 발생시 메시지를 연결된 모든 클라이언트로 보냄
    socket.on("message", (message) => {
        const parsedMsg = JSON.parse(message);
        
        switch(parsedMsg.type) {
            case "new_message" :
                sockets.forEach(aSocket => aSocket.send(`${socket.nickname} : ${parsedMsg.payload}`));
                break;
            case "nickname" :
                socket["nickname"] = parsedMsg.payload;
                break;
            default : break;
        }    
    });

    socket.on("close", () => console.log("Disconnected from the Browser"));
})

server.listen(3000, handleListen) ;
*/

// 2. socket.io 를 이용하는 방법
/*
    실제 규모가 큰 프로그램 개발시 여러 개의 서버 필요
    A 서버의 클라이언트가 B 서버의 클라이언트로 메시지 보낼 경우
    adapter 를 통해 백엔드 사이에서 전송해야함

    adapter 미 설정시 기본적으로 메모리를 사용 -> 다른 서버로의 통신 X
    mongoDB나 다른 adapter 이용시 서버간 통신 가능

    socket 은 rooms 와 sids 프로퍼티가 존재
    sids => socket들의 id
    rooms => socket id 와 같은 이름의 private room + public room
 */
ioServer.on("connection", socket => {
    socket["nickname"] = "Anonymous";

    // 이벤트, (payload, callback_function)
    // 서버는 프론트엔드에서 받은 함수를 호출할 수 있음 -> 프론트엔드단에서 실행
    /* 
        보안 이슈 및 데이터베이스 삭제 코드를 실행 할 수도 있기 때문에
        백엔드는 클라이언트가 보낸 함수를 실행해선 안됨
    */

    // 어느 이벤트에서나 실행하는 메서드
    socket.onAny((event) => {
        //console.log(ioServer.sockets.adapter);
        // console.log(`Socket Event: ${event}`);
    })

    // 연결이 끊기기 직전 발생하는 메서드
    socket.on("disconnecting", ()=> {
        socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname, countRoom(room)-1));
        // ioServer.sockets.emit("room_change", publicRooms());
    });

    // 연결이 끊기면 발생하는 이벤트
    socket.on("disconnect", ()=>{
        ioServer.sockets.emit("room_change", publicRooms());
    })

    socket.on("enter_room", (nick,roomName) => {

        console.log("Hello", nick, roomName);

        // 방(room) 설정
        socket.join(roomName);

        socket["nickname"] = nick;

        // 모든 소켓에 메시지 보냄
        ioServer.sockets.emit("room_change", publicRooms());

        // 본인을 제외하고 모두에게 메시지 보냄
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));        
        
        socket.on("offer", (offer, roomName) => {
            socket.to(roomName).emit("offer", offer);
        })

        socket.on("answer", (answer, roomName) => {
            socket.to(roomName).emit("answer", answer);
        })

        socket.on("ice", (ice, roomName) => {
            socket.to(roomName).emit("ice", ice);
        })
        // 서버 콘솔에서 실행
        // console.log(roomName);

        // socket id -> room의 key가 됨
        // console.log(socket.id);

        // console.log(socket.rooms);

        // 클라이언트 콘솔에서 실행
        // 클라이언트로 argument 전달 가능
        // setTimeout(()=>{
        //     done("Hello from the server");
        // },1000);
    });

    socket.on("new_message", (msg, roomName, done) => {
        socket.to(roomName).emit("new_message", `${socket.nickname} : ${msg}`);
        done();
    })

    socket.on("nickname", (nickname) => socket["nickname"] = nickname);
})