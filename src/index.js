
import dotenv from "dotenv"
import  ConnectDb from  "./db/dbindex.js";

  import {app} from "./app.js"


dotenv.config({
    path : './.env'


})


ConnectDb()

.then(() =>{

    app.listen(process.env.PORT || 8000, () =>{
        console.log(`Server is running on port ${process.env.PORT}`);

    })
})
.catch((err)=>{
    console.log(err)
})















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
