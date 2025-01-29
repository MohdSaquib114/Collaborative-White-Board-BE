import WebSocket from "ws";
type UserType = {
    socket:WebSocket,
    isHost:boolean
}
type userMap = Map<string,UserType>;
type messageType = {
    username:string,
    message:string
}

export type RoomType = {

    users:userMap,
    messages:messageType[]
    addUser:(name:string,socket:WebSocket,isHost:boolean)=>boolean
    removeUser:(name:string)=>boolean
    // assignNewHost:()=>string | undefined
    addMessage:(username:string,message:string) => void
}

export class Room {
   
    users:userMap
    messages:messageType[]
    constructor(){
        this.users = new Map()
         this.messages = []
       
    }
    addUser(username:string,socket:WebSocket,isHost:boolean):boolean{
        const existingUser = this.users.get(username)
        if(existingUser){
            return false
        }
        this.users.set(username,{socket,isHost})
        return true
    }

    removeUser(name:string):boolean{
        const existingUser = this.users.get(name)
        if(existingUser){
            this.users.delete(name)
            return true
        }
       
        return false
    }
//   assignNewHost():string | undefined {
//     const [username,userSocket] = this.users.entries().next().value || []
//     if(username && userSocket){
//         this.host = userSocket
//         this.hostName = username
//         this.users.delete(username)
//     }
//     return username 
//   }
  addMessage(username:string,message:string){
    this.messages.push({username,message})
  }
getMessage(){
    return this.messages
}

}