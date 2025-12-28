import { v2 as cloudinary } from "cloudinary";
import type { Request, Response } from "express";
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from "../env.js";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";


cloudinary.config({
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  cloud_name: CLOUDINARY_CLOUD_NAME,
});

export const getCloudinaryAuth = asyncHandler(
  async (_req: Request, res: Response) => {
    const timestamp: number = Math.floor(Date.now() / 1000);
    const folder = "frequency-chat-app";

    const signature: string = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      CLOUDINARY_API_SECRET
    );

    const data = {
      signature,
      cloudName: CLOUDINARY_CLOUD_NAME,
      timestamp,
      folder,
      apiKey: CLOUDINARY_API_KEY,
    };

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          data,
          "Cloudinary signature generated successfully"
        )
      );
  }
);
