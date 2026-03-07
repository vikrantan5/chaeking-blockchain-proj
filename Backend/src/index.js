import dotenv from "dotenv"
import connectDB from "./config/DBConnection.js"
import { server } from "./websocket.js"
import { app } from "./app.js"

dotenv.config({
    path: "./.env"
})

server.listen(5050, () => {
    console.log("WebSocket server is running on port 5050");
})

connectDB()
.then(()=>{
    app.on("error", (error)=>{
        console.log("ERROR :", error);
        throw error
    })
    app.listen(process.env.PORT || 5500, ()=>{
        console.log(`SERVER IS RUNNING ON PORT : ${process.env.PORT || 5000}`);
        
    })
})
.catch((err)=>{
    console.log("MONGODB CONNECTION FAILED !!", err); 
})

