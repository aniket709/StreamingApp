import { ApiError } from "../utils/apiError"
import { asyncHandler } from "../utils/asyncHandler"
import jwt from "jsonwebtoken";
import { User } from "../model/user.model";

   




export const verifyJwt = asyncHandler ( async (req,res,next) =>{

   try {
    const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
 
    if (!token){
     throw new ApiError(401,"Unauthorize request")
    }
    const decodedToken=   jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
 
   const user =  await User.findById(decodedToken?._id).select("-password-refreshToken")
 
   if (!user){
 
     throw new ApiError (401 ,"newApiError")
   }
 req.user = user
 next()
   } catch (error) {
    throw new ApiError(401,error?.message || "Invalid Access token")
    
   }



})

