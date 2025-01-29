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
  console.log("User connected");

  socket.on("message", (data) => {
    const message: MessageType = JSON.parse(data.toString());
    const roomId = message?.roomId;

    switch (message.type) {
      case "createRoom":
        try {
          
          const room: RoomType = new Room();
          const newRoomId = uuidv4();
          
          room.addUser(message.payload.username,socket,true)
          rooms[newRoomId] = room;
          
          const response = {
            type: "createRoom",
            success: true,
            payload:{
              roomId: newRoomId,
              username: message.payload?.username,
              isHost:true
            }
          };
          
          socket.send(JSON.stringify(response));
        } catch (error) {
          
          socket.send(JSON.stringify({
            success:false,
            type:'createRoom'
          }));
        }

        break;

      case "addUser":
      
        const currentRoom = rooms[roomId as string];
       
        if (!roomId || !message.payload?.username) {
          socket.send(
            JSON.stringify({
              type: "addUser",
              success: false,
              payload:{

                message: "Room id or username  is not provided",
              }
            })
          );
        } else if (!currentRoom) {
          socket.send(
            JSON.stringify({
              type: "addUser",
              success: false,
              payload:{

                message: "No room exists",
              }
            })
          );
        } else if (currentRoom.users.has(message.payload.username)) {
          socket.send(
            JSON.stringify({
              type: "addUser",
              success: false,
              payload:{

                message: "User already in the room",
              }
            })
          );
        } else {
          console.log(message.payload.username)
          currentRoom.users.set(message.payload.username, {socket:socket,isHost:false});
          currentRoom.users.forEach((user, username) => {
            if (username !== message.payload.username) {
              user.socket.send(
                JSON.stringify({
                  type: "addUser",
                  success: true,
                  payload:{

                    message: `${message.payload.username} joined the room`,
                    username: message.payload.username,
                  }
                })
              );
            }
          });
        
          socket.send(
            JSON.stringify({
              success: true,
              type:"addUser",
              payload:{

                roomId: message.roomId,
                username:message.payload.username,
                isHost:false
              }
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
                success:false,
                payload:{

                  message: "Room does not exist",
                }
            })
          );
          return;
        }
      
          const users: string[] = Array.from(insideRoom?.users?.keys()) || [];
        
            socket.send(
              JSON.stringify({
                type: "room",
                success:true,
                payload:{
                  users:users,
                  messages:insideRoom.messages
                }
              
              })
            );
        //   });
       
        //   socket.send(
        //     JSON.stringify({
        //       message: "Room is empty",
        //     })
        //   );
        
        break;
      case "message":
        const {username,newMessage} = message.payload
        if(!roomId) {
          socket.send(
            JSON.stringify({
              type: "addUser",
              success: false,
              payload:{

                message: "Room id is not provided",
              }
            })
          );
          return
        } 
        const currentRoomM = rooms[roomId]
        currentRoomM.addMessage(username,newMessage)
        currentRoomM.users.forEach((user, username) => {
          if (username !== message.payload.username) {
            user.socket.send(
              JSON.stringify({
                type: "message",
                success: true,
                payload:{
                  message: newMessage,
                  username: message.payload.username,
                }
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
              type: "removeUser",
              success: false,
              payload:{

                message: "Room id is not provided",
              }
            })
          );
        }  else if (!message.payload?.username) {
          socket.send(
            JSON.stringify({
              type: "removeUser",
              success: false,
              payload:{

                message: "Username is not provided",
              }
            })
          );
        } else {
          console.log(message.payload.username)
          roomRemove?.users.delete(message.payload?.username);
          roomRemove?.users.forEach((userSocket, user) => {
            // if (socket !== userSocket.socket) {
              userSocket.socket.send(
                JSON.stringify({
                    type:"removeUser",
                    success:true,
                    payload:{

                      username:message.payload.username
                    }
                })
              );
            // }
          });
          
        break;
    }
  }
  });

  socket.on("close", () => {
    console.log("User disconnected");
    Object.entries(rooms).forEach(([roomId, room]) => {
    //   if (socket === room.host) {
    //     const oldHostName = room.hostName;
    //     const newHostName = room.assignNewHost();
    //     if (newHostName) {
    //       room.users.forEach((userSocket, username) => {
    //         userSocket.send(
    //           JSON.stringify({
    //             message: `Host ${oldHostName} left the room. New host is ${newHostName}`,
    //           })
    //         );
    //       });
    //     } else {
    //       delete rooms[roomId];
    //     }
    //   } else {
        let user = "";
        for (const [username, userSocket] of room.users.entries()) {
          if (userSocket.socket === socket) {
            room.users.delete(username);
            user = username;
            console.log(`Removed ${username} from room ${roomId}`);
          }
        }
        room.users.forEach((userSocket, username) => {
          userSocket.socket.send(
            JSON.stringify({
              type:"removeUser",
              success:true,
              payload:{
                message: `${user} left the room`,

              }
            })
          );
        });


      
    });
  });
});
