
import dotenv from "dotenv"
import  ConnectDb from  "./db/index.js";



dotenv.config({
    path : './env'


})

ConnectDb()














/*

import { Express } from "express";

;( async ()=>{

    try{

       await  mongoose.connect (`${process.env.MONGODB_URI}/${DB_NAME}`)

       app.on("error",(error)=>{
        console.log("Error")
        throw err
       })

       app.listen(process.env.PORT,()=>{

        console.log("App is listining on port " `${process.env.PORT}`)
       })

    } catch(error){

        console.error(error)

        throw err
    }

})()

*/
