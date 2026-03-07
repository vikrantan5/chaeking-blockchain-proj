import dotenv from "dotenv"
import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import { ApiError } from "../utils/ApiError.js"

dotenv.config({
    path: "./.env"
})

// cloudinary configuration
cloudinary.config({
    cloud_name: 'dblsx0c7v',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
})

const uploadOnCloudinary = async(localFilePath) =>{
    try {
        if(!localFilePath) return null

        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // file has been uploaded successfully 
        // console.log("File is uploaded on Cloudinary ", response.url);
        fs.unlinkSync(localFilePath);
        return response;
        
    } catch (error) {
        console.log("CLOUDINARY UPLOAD FAILED !!", error);
        fs.unlinkSync(localFilePath)
        return null
    }
}

const deleteFromCloudinary = async (publicId, resourceType = "auto") => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        return result;
        
    } catch (error) {
        throw new ApiError(500, "Failed to delete image from Cloudinary");
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}