import mongoose from "mongoose";

import { DB_NAME } from "../constants.js";

const ConnectDb = async ()=>{

    try {

        const DbVariable=  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        console.log (`\n MongoDb connected || db host:${

            DbVariable.connection.host
        }`)


    }catch(error){
        console.error(error)
         process.exit(1)
    }


}

export default ConnectDb