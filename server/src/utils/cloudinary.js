import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuration for Cloudinary
cloudinary.config({
    cloud_name:'dzqrbluaz',
    api_key:955861654645939,
    api_secret:'LqlsWSJ6gPTmKy6Jdv9y-0fe4ug',
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            throw new Error('No file path provided');
        }

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto" // Automatically detect file type (image, video, etc.)
        });

        // Clean up the local file after successful upload
        fs.unlinkSync(localFilePath);

        // Return the Cloudinary response (containing the uploaded file URL)
        return response;

    } catch (error) {
        // Remove the local file if upload fails
        try {
            fs.unlinkSync(localFilePath);
        } catch (unlinkError) {
            console.error("Failed to remove local file:", unlinkError);
        }

        console.error("Cloudinary upload error:", error);
        throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
    }
};

export { uploadOnCloudinary };
