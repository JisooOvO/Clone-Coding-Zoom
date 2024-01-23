# Noom
> [노마드 코더](https://nomadcoders.co/)의 줌 클론코딩 강의를 수강하며 만든 프로젝트입니다.

## Project result
![localhost_3000_ (1)](https://github.com/JisooOvO/Clone-Coding-Zoom/assets/138751028/0a71e7bb-93b4-4721-aa09-e72d3b55d328)

## 결과
- socket.io 를 통한 1대1 채팅 구현
- webRTC 구현 실패

## What I learned
- webAPI webSocket은 메시지 송수신 외 다른 기능 제공 X
  - 따라서 socket.io / stomp 등 라이브러리 사용
- WebRTC 는 peer-to-peer 통신
  - 1대1간 비디오/오디오 전송 가능
  - DataChannel 이용하여 텍스트 전송 가능
  - 다수의 peer 요구시 부적합 -> SFU 사용 
- node.js express로 서버 구현하는 방법
  
## 개발 환경
- Chrome
- VS Code
- Node.js 18.18.0
- NPM 9.8.1
- Express 4.18.2
- localtunnel 2.0.2
- pug 3.0.2
- socket.io 4.7.4
- ws 8.16.0
