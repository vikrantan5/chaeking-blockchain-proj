import dotenv from "dotenv"
import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import path from "path"
import { ApiError } from "../utils/ApiError.js"

dotenv.config({
    path: "./.env"
})

// cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
})

// Helper function to safely delete a file
const safeDeleteFile = (filePath) => {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ File deleted: ${filePath}`);
        } else {
            console.log(`⚠️ File not found, skipping deletion: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error deleting file ${filePath}:`, error.message);
    }
};

// Helper function to ensure temp directory exists
const ensureTempDirExists = () => {
    const tempDir = path.join(process.cwd(), 'public', 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log('✅ Temp directory created:', tempDir);
    }
    return tempDir;
};

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.log("❌ No file path provided");
            return null;
        }

        console.log(`📁 Attempting to upload file: ${localFilePath}`);

        // Check if file exists
        if (!fs.existsSync(localFilePath)) {
            console.log(`❌ File does not exist at path: ${localFilePath}`);
            
            // Try to ensure temp directory exists
            ensureTempDirExists();
            
            // Check if it's just the directory that doesn't exist
            const dir = path.dirname(localFilePath);
            if (!fs.existsSync(dir)) {
                console.log(`❌ Directory does not exist: ${dir}`);
            }
            
            return null;
        }

        // Get file stats
        const stats = fs.statSync(localFilePath);
        console.log(`📊 File size: ${stats.size} bytes`);

        if (stats.size === 0) {
            console.log("❌ File is empty");
            safeDeleteFile(localFilePath);
            return null;
        }

        // Upload the file on cloudinary
        console.log("☁️ Uploading to Cloudinary...");
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        // File has been uploaded successfully 
        console.log("✅ File uploaded to Cloudinary:", response.url);
        
        // Safely delete the local file
        safeDeleteFile(localFilePath);
        
        return response;
        
    } catch (error) {
        console.log("❌ CLOUDINARY UPLOAD FAILED !!", error);
        
        // Safely delete the local file even if upload failed
        safeDeleteFile(localFilePath);
        
        return null;
    }
}

const deleteFromCloudinary = async (publicId, resourceType = "auto") => {
    try {
        if (!publicId) {
            throw new ApiError(400, "Public ID is required");
        }

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        
        if (result.result === 'ok') {
            console.log(`✅ Deleted from Cloudinary: ${publicId}`);
        } else {
            console.log(`⚠️ Cloudinary deletion result: ${result.result}`);
        }
        
        return result;
        
    } catch (error) {
        console.error("❌ Failed to delete from Cloudinary:", error);
        throw new ApiError(500, "Failed to delete image from Cloudinary");
    }
}

// Helper function to upload multiple files
const uploadMultipleToCloudinary = async (files, folder = "ngos") => {
    if (!files || files.length === 0) return [];
    
    const uploadPromises = files.map(async (file) => {
        try {
            const result = await uploadOnCloudinary(file.path);
            return result;
        } catch (error) {
            console.error(`❌ Failed to upload file: ${file.originalname}`, error);
            return null;
        }
    });

    const results = await Promise.all(uploadPromises);
    return results.filter(result => result !== null);
};

// Helper function to validate file before upload
const validateFile = (file) => {
    if (!file) return { valid: false, error: "No file provided" };
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        return { valid: false, error: "File size exceeds 5MB limit" };
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
        return { valid: false, error: "Invalid file type. Only images and PDFs are allowed." };
    }
    
    return { valid: true };
};

export {
    uploadOnCloudinary,
    deleteFromCloudinary,
    uploadMultipleToCloudinary,
    validateFile,
    safeDeleteFile,
    ensureTempDirExists
};