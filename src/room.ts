import WebSocket from "ws";

type userMap = Map<string,WebSocket>;

export type RoomType = {
    host:WebSocket,
    hostName:string,
    users:userMap,
    addUser:(name:string,socket:WebSocket)=>boolean
    removeUser:(name:string)=>boolean
    assignNewHost:()=>string | undefined
}

export class Room {
   
    host:WebSocket;
    hostName:string;
    users:userMap = new Map()
    constructor(host:WebSocket,name:string){
       this.host = host
       this.hostName = name
    }
    addUser(name:string,socket:WebSocket):boolean{
        const existingUser = this.users.get(name)
        if(existingUser){
            return false
        }
        this.users.set(name,socket)
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
  assignNewHost():string | undefined {
    const [username,userSocket] = this.users.entries().next().value || []
    if(username && userSocket){
        this.host = userSocket
        this.hostName = username
        this.users.delete(username)
    }
    return username 
  }

}