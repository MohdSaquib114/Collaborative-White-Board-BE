import WebSocket, { WebSocketServer } from "ws";
import { Room, RoomType } from "./room";
import { v4 as uuidv4 } from "uuid";

type MessageType = {
  type: string;
  roomId?: string;
  payload?: any;
};

const rooms: Record<string, RoomType> = {};

const socketServer = new WebSocketServer({ port: 8080 });

socketServer.on("connection", (socket: WebSocket) => {
 

  socket.on("message", (data) => {
    const message: MessageType = JSON.parse(data.toString());
    const roomId = message?.roomId;

    switch (message.type) {
      case "createRoom":
        try {
          const room: RoomType = new Room();
          const newRoomId = uuidv4();
          
          room.addUser(message.payload.username, socket, true);
          rooms[newRoomId] = room;
          
          const response = {
            type: "createRoom",
            success: true,
            payload: {
              roomId: newRoomId,
              username: message.payload?.username,
              isHost: true,
            },
          };
          
          socket.send(JSON.stringify(response));
        } catch (error) {
          socket.send(
            JSON.stringify({
              success: false,
              type: "createRoom",
            })
          );
        }
        break;

      case "addUser":
        const currentRoom = rooms[roomId as string];
        if (!roomId || !message.payload?.username) {
          socket.send(
            JSON.stringify({
              type: "addUser",
              success: false,
              payload: {
                message: "Room id or username is not provided",
              },
            })
          );
        } else if (!currentRoom) {
          socket.send(
            JSON.stringify({
              type: "addUser",
              success: false,
              payload: {
                message: "No room exists",
              },
            })
          );
        } else if (currentRoom.users.has(message.payload.username)) {
          socket.send(
            JSON.stringify({
              type: "addUser",
              success: false,
              payload: {
                message: "User already in the room",
              },
            })
          );
        } else {
       
          currentRoom.users.set(message.payload.username, { socket: socket, isHost: false });
          currentRoom.users.forEach((user, username) => {
            if (username !== message.payload.username) {
              user.socket.send(
                JSON.stringify({
                  type: "addUser",
                  success: true,
                  payload: {
                    message: `${message.payload.username} joined the room`,
                    username: message.payload.username,
                  },
                })
              );
            }
          });
          
          socket.send(
            JSON.stringify({
              success: true,
              type: "addUser",
              payload: {
                roomId: message.roomId,
                username: message.payload.username,
                isHost: false,
              },
            })
          );
        }
        break;

      case "room":
        const insideRoom = rooms[roomId as string];
        if (!insideRoom) {
          socket.send(
            JSON.stringify({
              type: "room",
              success: false,
              payload: {
                message: "Room does not exist",
              },
            })
          );
          return;
        }
        if (!insideRoom.users.has(message.payload.username)) {
          insideRoom.addUser(message.payload.username, socket, message.payload.isHost);
        }
        const users: string[] = Array.from(insideRoom?.users?.keys()) || [];
        
        socket.send(
          JSON.stringify({
            type: "room",
            success: true,
            payload: {
              users: users,
              messages: insideRoom.messages,
            },
          })
        );
        break;

      case "message":
        const { username, newMessage } = message.payload;
        if (!roomId) {
          socket.send(
            JSON.stringify({
              type: "addUser",
              success: false,
              payload: {
                message: "Room id is not provided",
              },
            })
          );
          return;
        }
        const currentRoomM = rooms[roomId];
        currentRoomM.addMessage(username, newMessage);
        currentRoomM.users.forEach((user) => {
          user.socket.send(
            JSON.stringify({
              type: "message",
              success: true,
              payload: {
                message: newMessage,
                username: message.payload.username,
              },
            })
          );
        });
        break;

      case "canvasUpdate":
      
      
        if (!roomId) {
          socket.send(
            JSON.stringify({
              type: "canvasUpdate",
              success: false,
              payload: {
                message: "Room id is not provided",
              },
            })
          );
          return;
        }
        const roomForCanvas = rooms[roomId];
     
        roomForCanvas.users.forEach((user) => {
          if(socket !== user.socket){

            user.socket.send(
              JSON.stringify({
                type: "canvasUpdate",
                success: true,
                payload: {
                  canvasData: message.payload,
                },
              })
            );
          }
          });
        break;

      case "removeUser":
        const roomRemove = rooms[roomId as string];
        if (!roomRemove) {
          socket.send(
            JSON.stringify({
              type: "remove",
              success: false,
              payload: {
                message: "Room id is not provided",
              },
            })
          );
        } else if (!message.payload?.username) {
          socket.send(
            JSON.stringify({
              type: "remove",
              success: false,
              payload: {
                message: "Username is not provided",
              },
            })
          );
        } else {
         
          roomRemove?.users.delete(message.payload?.username);
       
            roomRemove?.users.forEach((userSocket, user) => {
            userSocket.socket.send(
              JSON.stringify({
                type: "remove",
                success: true,
                payload: {
                  username: message.payload.username,
                },
              })
            );
          });
        }
        break;
    }
  });
  
  socket.on("close", () => {
    
    console.log("User disconnected");
  });
});
