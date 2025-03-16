
import {asyncHandler} from "../utils/asyncHandler.js"
import  {ApiError} from "../utils/apiError.js"
import {User} from "../model/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import { response } from "express";
import jwt from "jsonwebtoken";



const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found during token generation");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    if (!accessToken || !refreshToken) {
      throw new Error("Token generation failed");
    }

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong in token generation");
  }
};
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
const loginUser = asyncHandler( async(req,res)  =>{

      const {email,username,password} =req.body

      if (! (username ||  email)){
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
      .select("-password-refreshToken")

      const options = {
        httpOnly : true,
        secure:true
      }

      return  res
      .status(200)
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

      return res.status(200)
      .clearCookie("accessToken",options)
      .clearCookie("refreshToken",options)
      .json(new apiResponse (200,{},"user logout"))


       })
const refreshAccessToken=  asyncHandler(  async(req,res)=>{

       const IncomingRefreshToken= req.cookie.refreshToken || req.body.refreshToken

       if (!IncomingRefreshToken){
        throw new ApiError(401,"Unauthorize request ");
       }

       try {
        const decodedToken = jwt.verify(
         IncomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET)
 
        const user=   await User.findById(decodedToken?._id)
 
        if (!user){
         throw new ApiError(401,"Invalid refreshToken")
        }
 
        if (IncomingRefreshToken!=user?.refreshToken){
         throw new ApiError(401,"Refresh Token is used ")
        }
 
           const options ={
             httpOnly :true,
             secure:true
           }
 
          const{accessToken,newRefreshToken}= await  generateAccessAndRefreshToken(user._id)
 
           return res.status(200)
           .cookie("accessToken",accessToken,options)
           .cookie("refreshToken",newRefreshToken,options)
           .json(
             new apiResponse(
               accessToken,newRefreshToken,"Access Token refreshed "
             )
           )
 
       } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refreshToken")
        
       }

     
         

       })
  const changeCurrentPassword = asyncHandler(async(req,res)=>{

        const{oldPassword,newPassword,confirmPassword}=  req.body

      const user = await User.findById(req.user?._id)   // user is already loged in so we will request id from the user
      const Ispasswordcorrect = await user.isPasswordCorrect(oldPassword)

      if (newPassword !== confirmPassword) {
        throw new ApiError(400, "Confirm password does not match new password");
    }
      if (!Ispasswordcorrect){
        throw new ApiError(400,"your old password is Invalid");
      }

              user.password(newPassword)
               await user.save({validateBeforeSave:false})

               return res.status(200)
               .json(
                new apiResponse (200,{},"Password changed")
               )
       })
  const getCurrentUser = asyncHandler(async(req,res)=>{
        res.status(200)
        .json(
          200, res.user,"Current user Fetched"
        )
       })
   const updateAccountDetail = asyncHandler(async(req,res)=>{
    const{fullName,email}=req.body
       if (!fullName || !email){
        throw new ApiError(400,"all fields are required")
       }

      const user=  User.findByIdAndUpdate(
        req.user?._id,
       {
        $set:{
          fullName,
          email
        }
       },
       {new:true}


        ).select("-password")
        return res.status(200)
        .json(
          new apiResponse(
            200,user,"accountDetailsUpdatedSuccessfully"
          )
        )
   })
       const updateUserAvatar = asyncHandler(async(req,res)=>{
        const avatarLocalPath=req.file?.path
        if(!avatarLocalPath){
          throw new ApiError (400,"Avatar file is missing")
        }
              const avatar=await uploadOnCloudinary(avatarLocalPath)

              if (!avatar.url){
                throw new ApiError(400,"Error while uploading")
              }

            const user=   await User.findByIdAndUpdate(req.user?._id,
                {
                  $set:{
                    avatar : avatar.url
                  }
                },{

                  new:true

                }).select("-password")

                res.status(200).
                apiResponse(200,user ,"avatar updated successfully")
       })
const updateCoverImage = asyncHandler(async(req,res)=>{

        const coverImageLocalPath=  req.file

        if (!coverImageLocalPath){
          throw new ApiError(400,"cover Image Path is not founded")
        }

       const coverImage=   await uploadOnCloudinary(coverImageLocalPath)
       if (!coverImage.url){
        throw new ApiError(400,"cover Image is not uploaded on cloudinary")
       }

          const cover= awaitUser.findByIdAndUpdate(req.user?._id,
{
        $set :{
          coverImage : coverImage.url
        }
      },
        {
          new:true
        }
        ).select("-password")
        res.status(200).json(
          200,cover,"cover image uploded successfully"
        )
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{

  const {username} =req.params

  if (!username?.trim()){
    throw new ApiError (400,"username is missing")
  }

  const channel= await User.aggregate([
    {

      $match : {
        username : username?.toLowerCase()
      }

    },
    {
      $lookup :{
        from :"subscriptions",
        localField:"_id",
        as :"subscriber",
      }
    },{
      $lookup :{
        from :"subscriptions",
        localField:" subscriber",
        as :"subscriberTo",

    }},
    {
      $addFields :{
        subscriberCounts: {
          $size:"$subscribers"
        },
        channelSubscribedToCount :{
          $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if :{
              $in:[req.user?._id,"$subscriber.subscribe"],
              then:true,
              else:false
            }

          }
        }
      }
    },{
      $project:{
        fullName : true,
        userame:1,
        subscriberCounts:1,
        channelSubscribedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1
      }
    }
  ])
if (!channel?.length){
  throw new ApiError(404,"channel does not exit ")
}

return res .status(200).json(new apiResponse
 (
  200,channel[0],"channel-fetched-successfuly"
))


})








export {

  registerUser
  ,loginUser
  ,logOutUser,
  refreshAccessToken,
  changeCurrentPassword
  ,getCurrentUser
  ,updateAccountDetail
,updateUserAvatar
,updateCoverImage
,getUserChannelProfile

}




