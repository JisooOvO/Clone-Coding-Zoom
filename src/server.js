import http from "http";
import WebSocket from "ws";
import express from "express";

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

// 포트 설정
// app.listen(3000,handleListen);

// http 서버 생성
const server = http.createServer(app);

// websocket 서버 생성
const wss = new WebSocket.Server({ server });

// 두 서버를 같은 포트에서 함께 접근 가능
// http://localhost:3000
// ws://localhost:3000

wss.on("connection", (socket) => {
    // socket = 연결된 브라우저
    console.log("Connected to Browser");
    socket.send("hello!");
})

server.listen(3000, handleListen);