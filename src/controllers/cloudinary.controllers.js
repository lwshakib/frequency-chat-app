import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
});

export const getCloudinaryAuth = async (req, res) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "frequency-chat-app";
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );
    return res.json({
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      timestamp,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (error) {
    console.error("Error in cloudinary-signature GET:", error);
    return res.status(500).json({
      error:
        process.env.NODE_ENV === "development"
          ? `Internal Server Error: ${
              error instanceof Error ? error.message : String(error)
            }`
          : "Internal Server Error",
      ...(process.env.NODE_ENV === "development" &&
        error instanceof Error && { stack: error.stack }),
    });
  }
};
