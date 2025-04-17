// server.js
import express from "express";
import axios from "axios";
import ip from "ip";
import path from "path";
import { fileURLToPath } from "url";
import Replicate from "replicate";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // ⬅️ support large base64 uploads

// Replicate instance
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// POST endpoint for base64 image
app.post("/imageApi", async (req, res) => {
  try {
    const imageBase64 = req.body.image;

    if (!imageBase64 || !imageBase64.startsWith("data:image")) {
      return res
        .status(400)
        .json({ error: "Invalid or missing base64 image." });
    }

    console.log("🧼 Restoring face with GFPGAN...");

    const output = await replicate.run(
      "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
      {
        input: {
          img: imageBase64,
          scale: 2,
          version: "v1.4",
        },
      }
    );

    const restoredImageURL = output.url().href;
    console.log("✅ Restored image URL:", restoredImageURL);

    if (!restoredImageURL || !restoredImageURL.startsWith("http")) {
      throw new Error("Invalid restored image URL from Replicate.");
    }

    res.json({ image: restoredImageURL });
  } catch (err) {
    console.error("❌ Error processing image:", err.message);
    res.status(500).send("Something went wrong.");
  }
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  const ipAddress = ip.address();
  console.log(`🚀 Server is running at http://${ipAddress}:${PORT}`);
});
