import express from "express";

// express 실행
const app = express();

// pug template 설정
app.set('view engine','pug');
app.set('views', __dirname + "/views");

// static 설정
app.use("/public", express.static(__dirname + "/public"));

// 렌더링 설정
app.get("/", (req,res) => res.render("home"));

const handleListen = () => console.log('Listening on http://localhost:3000');

// 포트 설정
app.listen(3000,handleListen);

