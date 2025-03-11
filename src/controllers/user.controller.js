import { response } from "express"
import {asyncHandler} from "../utils/asyncHandler.js"
import  {ApiError} from "../utils/apiError.js"
import {User} from "../model/user.model.js"
import { uploadOnCloudinary } from "../utils/claudinary.js";
import { apiResponse } from "../utils/apiResponse.js";




const registerUser = asyncHandler (async( req , res )=>{
 
    // get user detail 
    // validate  -- not empty 
    //check if the user is already present  username , email 
    //check for images avataar 
    // upload them to cloudinary 
    //create user object -- create entry in database 
    //  remove password and refresh token 
    // check for user creation 

    // return res

         const {fullname,email,username,password }=req.body

         console.log ("email",email)

        //  if (fullname==""){

        //     throw new ApiError(400 ,"full name is required")

        //  }

        if (
            [fullname,email,username,password].some((field)=> field?.trim()==="")
        ){

            throw new ApiError(400 ,"All field are required")

        }

       const exisitedUser= User.findOne({
            $or:[{username},{email}]
        })
         if (exisitedUser){
         throw new ApiError (409 ,"User with this email already exists")
         }

       const avatarLocalPath= req.files?.avatar[0]?.path

         const coverImageLocalPath= req.files?.coverImage[0]?.path

         if (!avatarLocalPath){
            throw new ApiError(400 ,"Avtar file  is necessary")
         }


        const avatar= await uploadOnCloudinary  (avtarLocalPath)
        const coverImage = await uploadOnCloudinary  (coverImageLocalPath)

        if (!avatar){
            throw new ApiError(400 ,"Avtar is required")
        }



       const user= await  User.create({

            fullName,
            avatar:avatar.url,
            coverImage:coverImage.url?.url ||"",
            email,
            password,
            username: username.toLowerCase()

        })


      const createdUser= await User.findById(user_id).
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




