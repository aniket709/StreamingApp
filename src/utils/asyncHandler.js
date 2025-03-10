

const asyncHandler = (requestHandler) =>{

    (req,res,next) =>{

        Promise.resolve(requestHandler(req,res,next)).catch((error) => next(error))

    }
}


// try catch   

// const asyncHandler = (fn) => async(req,res,next) =>{

//     try{

//         await(req,res,next);



//     }
//     catch (error){
//         res.status(error.code || 500 ) .json({
//             success:false,
//             message: error.message|| "Internal server crash"
//         })

//     }

// }

export {asyncHandler}