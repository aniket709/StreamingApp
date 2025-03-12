
import {asyncHandler} from "../utils/asyncHandler.js"
import  {ApiError} from "../utils/apiError.js"
import {User} from "../model/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";


const registerUser = asyncHandler (async( req , res )=>{
 
         const {fullName,email,username,password }=req.body

        if (
            [fullName,email,username,password].some((field)=> field?.trim()==="")
        ){

            throw new ApiError(400 ,"All field are required")

        }
       const exisitedUser=  await User.findOne({
            $or:[{username},{email}]
        })
         if (exisitedUser){
         throw new ApiError (409 ,"User with this email already exists")
         }

    if (exisitedUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    // if (username.length < 5){
    //   throw new ApiError(400 ,"username should be greater than 4 ")
    // }



         const avatarLocalPath = await req.files?.avatar?.[0]?.path;  // Avatar file path

        let coverImageLocalPath;  // Variable for cover image path

// Check if coverImage is present in files
if (req.files?.coverImage && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
}

// If avatar is not uploaded, throw error
if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is necessary");
}

// Upload to Cloudinary
const avatar = await uploadOnCloudinary(avatarLocalPath);
const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

// Check if avatar upload is successful
if (!avatar) {
    throw new ApiError(400, "Avatar is required");
}

// Create the user with the uploaded details
const user = await User.create({
    fullName,
    avatar: avatar.url,  // Avatar URL
    coverImage: coverImage?.url || "",  // Use empty string if cover image is not uploaded
    email,
    password,
    username: username.toLowerCase()
});



      const createdUser= await User.findById(user._id).
      select(
        "-password-refreshToken"
      )

      if (!createdUser){
        throw new ApiError(500,"Something went wrong while registring the user")
      }
   
      return res.status(201).json(

        new apiResponse (200,createdUser,"user-resistered-successfully")
      )
      

    })



export {registerUser}




