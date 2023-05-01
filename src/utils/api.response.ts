import { Response } from "express"

export const successResponse = (message: string, body: object |[]|null,res: Response)=>{

    return res.status(200).json({
        status: 200,
        message: message,
        data: body
    })
}

export const errorResponse = (message: string,res: Response)=>{
    return res.status(400).json({
        status: 400,
        message: message
    })
}

export const invalidTraffic = (message: string,res: Response)=>{
    return res.status(429).json({
        status: 429,
        message: message
    })
}

export const notFoundResponse = (field: string,value:string|object,entity:string,res:Response)=>{
    return res.status(404).json({
        status: 404,
        message: entity+" with "+field+" of ["+value+"] not found"
    })
}

export const serverErrorResponse = (ex:any,res:Response)=>{
    return res.status(500).json({
        status: 500,
        message: "Server Error",
        stackTrace: ex
    })
}