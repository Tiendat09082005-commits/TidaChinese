import cloudinary from '../../../config/cloudinary.js'

// Upload file buffer to Cloudinary, returns the entire result object containing public_id and secure_url
export function uploadToCloudinary(fileBuffer, folderName, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folderName, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
}

// Delete file from Cloudinary using publicId and resourceType (image, video, raw)
export function deleteFromCloudinary(publicId, resourceType) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
}
