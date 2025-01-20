import WebSocket, { WebSocketServer } from "ws";
import { Room, RoomType } from "./room";
import { v4 as uuidv4 } from 'uuid';


type MessageType = {
    type: string;
    roomId?: string;
    payload?: any;
  }
  

const rooms : Map<string,RoomType> = new Map()

const socketServer = new WebSocketServer({port:8080})

socketServer.on("connection",(socket:WebSocket)=>{
 
  console.log("User connected") 
 socket.on("message",(data)=>{
   const message:MessageType = JSON.parse(data.toString())
   const roomId = message.roomId
   const username = message.payload.username

  switch(message.type){

    case "createRoom":
        const room : RoomType = new Room(socket,message.payload?.username)
        const newRoomId = uuidv4()
        rooms.set(newRoomId,room)
        const response = {
            type:"createRoom",
            roomId:newRoomId,
            success:true
        } 
        socket.send(JSON.stringify(response))
       
        break;

    case "addUser":
       
       
        const currentRoom = rooms.get(message.roomId as string)
        if(!roomId){
            socket.send(JSON.stringify({
                type:"addUser",
                success:false,
                message:"Room id is not provided"
            }))

        }
       else if(!message.payload.username){
            

            socket.send(JSON.stringify({
                type:"addUser",
                success:false,
                message:"Username is not provided"
            }))
        }
        else if(!currentRoom){
            socket.send(JSON.stringify({
                type:"addUser",
                success:false,
                message:"No room exist"
            }))
        }else if( currentRoom.users.has(message.payload.username)){
            socket.send(JSON.stringify({
                type:"addUser",
                success:false,
                message:"User already in the room"
            }))
        }else{
            currentRoom.users.set(message.payload.username,socket)
            currentRoom.users.forEach((user,username)=>{
                if(username !==message.payload.username ){

                    user.send(JSON.stringify({
                        type:"add-User",
                        success:true,
                        message:`${message.payload.username} join the room`,
                        username:message.payload.username
                        
                    }))
                }
            })
            currentRoom.host.send(JSON.stringify({
                type:"add-User",
                success:true,
                message:`${message.payload.username} join the room`,
                username:message.payload.username
                
            }))
            socket.send(JSON.stringify({
                success:true
            }))
        }

        
        break;
    case "room": 
        const insideRoom = rooms.get(message.roomId as string)
        if(!insideRoom) {
            socket.send(JSON.stringify({
                message:"Room does not exist"}
            ))
        }
        if(insideRoom?.users){

            const users: string[] = Array.from(insideRoom?.users?.keys()) || [];
            users.push(insideRoom.hostName)
            insideRoom.users.forEach((user,_)=>{
                user.send(JSON.stringify({
                    type:"all-users",
                    message:"Room is empty",
                    users:users
                }
                ))

            })
        }else{
            socket.send(JSON.stringify({
                message:"Room is empty"}
            ))
        }
        break;
    case "removeUser":
        const roomRemove = rooms.get(message.roomId as string)
        if(!roomRemove){
            socket.send(JSON.stringify({
                type:"removeUser",
                success:false,
                message:"Room id is not provided"
            }))
        }else if (roomRemove.host === socket){
           const newHost =    roomRemove.assignNewHost() 
           if(newHost){
            roomRemove?.users.forEach((userSocket,user)=>{
                if(socket !== userSocket){

                    userSocket.send(JSON.stringify({
                        message:`${message.payload.username} leave the room. New host is ${newHost}` 
                    }))
                }
            })
           }else{
            rooms.delete(message.roomId as string)
           }
        }
        else if(!message.payload?.username){
            socket.send(JSON.stringify({
                type:"removeUser",
                success:false,
                message:"Username is not provided"
            }))
            
        }else{
            
            roomRemove?.users.delete(message.payload?.username)
            roomRemove?.users.forEach((userSocket,user)=>{
                if(socket !== userSocket){

                    userSocket.send(JSON.stringify({
                        message:`${message.payload.username} leave the room` 
                    }))
                }
            })
            roomRemove.host.send(JSON.stringify({
                message:`${message.payload.username} leave the room` 
            }))
            

        }
 
  }
   
 })
  
 socket.on("close",()=>{
    console.log("user disconnected")
    rooms.forEach((room,roomId)=>{
        if(socket === room.host){
               const oldHostName = room.hostName
               const newHostName = room.assignNewHost()
               if(newHostName){

                   room.users.forEach((userSocket,username)=>{
                     userSocket.send(JSON.stringify({
                         message:`Host ${oldHostName} leave the room. New host is ${newHostName}`
                     }))
                   })
               }else{
                rooms.delete(roomId);
            }

        }else{
            let user = ""
           for (const[username,userSocket] of room.users.entries()){
               if (userSocket === socket) {
                   room.users.delete(username); 
                   user = username
                   console.log(`Removed ${username} from room ${roomId}`);
               }
           }
   
           room.users.forEach((usersocket,username)=>{
               usersocket.send(JSON.stringify({
                   message:`${user} leave the room`
               }))
           })
           
           
           
           if (room.users.size === 0) {
               rooms.delete(roomId);
               console.log(`Room ${roomId} deleted as it is empty`);
           }
       }

    })
    
    })
 })
   


