
import cloudinary from "cloudinary";
const { v2 } = cloudinary;



import fs from "fs";


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath)=>{

    try{
        if (!localFilePath) return null 
        const response =   await  cloudinary.uploader.upload(localFilePath,{
            resource_type:'auto'
        })
        console.log("path loaded succesfully" ,response.url);
        return response;

    } catch(error){



        fs.unlinkSync(localFilePath) // remove local file path 
        return null

    }


}


export {uploadOnCloudinary}


