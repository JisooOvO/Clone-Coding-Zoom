import http from "http";
// import WebSocket from "ws";
import express from "express";
import SocketIO from "socket.io";

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
const ioServer = SocketIO(httpServer);

// http / ws 서버를 같은 포트에서 함께 접근 가능
// http://localhost:3000
// ws://localhost:3000

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
ioServer.on("connection", socket => {
    console.log(socket);
})