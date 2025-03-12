
import {asyncHandler} from "../utils/asyncHandler.js"
import  {ApiError} from "../utils/apiError.js"
import {User} from "../model/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import { response } from "express";

const generateAccessAndRefreshToken = async (userId) =>{
  try{
    const user= await User.findById(userId)
    const accessToken= user.generateAccessToken()
    const refreshToken = user.generateRefreshToken ()

    user.refreshToken=refreshToken
    await user.save({
      validateBeforeSave:false
    })

    return {
      accessToken,
      refreshToken
    }

  }
  catch(error){

    throw new ApiError (500,"something went wrong")
  }

}


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


    // login user  

    // email || username 
    //password
    // forget password -------> 
    // access token and refresh token 

    const loginUser = asyncHandler( async(req,res)  =>{

      const {email,username,password} =req.body

      if (!username && !email){
        throw new ApiError(400,"Give email or username to login")
        
      }
     const user= await User.findOne({
             
        $or:[{username},{email}]

      })

      if (!user){
        throw new ApiError (404,"user is not registered")
      }

     const isPasswordValid= await user.isPasswordCorrect(password)

     if (!isPasswordValid){
      throw new ApiError (401,"Invalid password");
     }

    const{accessToken,refreshToken}= await generateAccessAndRefreshToken (user._id)

      const loggedUser=   await User.findById(user._id)
      select("-password-refreshToken")

      const options = {
        httpOnly : true,
        secure:true
      }

      return  res
      .send(200)
      .cookie("accessToken",   accessToken,options)
      .cookie("refreshToken",refreshToken,options)
      .json(
        new apiResponse (200,
          {
            user:loggedUser,
            accessToken,
            refreshToken

          }, "user loggedIn successfully")
      )

        
    })

    const logOutUser = asyncHandler ( async (req,res) =>{

      await  User.findByIdAndUpdate(

        req.user._id,
        {

          $set:{
            refreshToken :undefined
          }
          

        },
        {
          new : true
        }
       )

       const options = {
        httpOnly : true,
        secure:true
      }

      return response(200)
      .clearCookie("accessToken",option)
      .clearCookie("refreshToken",options)
      .json(new apiResponse (200,{},"user logout"))


       })





export {registerUser,loginUser,logOutUser}




