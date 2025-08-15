import express from "express";
import  ImageKit from "imagekit";

const router = express.Router();

const ik = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

router.get("/", async (req, res) => {
  const auth = ik.getAuthenticationParameters();
  res.json({ ...auth, publicKey: process.env.IMAGEKIT_PUBLIC_KEY });
});

export default router;
