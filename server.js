import express from "express";

import path from "path";
import { fileURLToPath } from "url";
import Replicate from "replicate";
import dotenv from "dotenv";
import cors from "cors";
import ip from 'ip';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const corsOptions = {
  origin: ["http://example.com", "http://localhost:3000"], // List of allowed origins
  methods: ["GET", "POST", "PUT", "DELETE"], // List of allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // List of allowed headers
};

const app = express();
app.use(express.json({ limit: "10mb" })); // To handle large base64 payloads
const PORT = process.env.PORT || 9080;
app.use(cors(corsOptions));
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});
app.get("/", (req, res) => {
  res.send("Hello from the server!");
}
);
app.post("/imageApi", async (req, res) => {
  try {
    const { image } = req.body; // Get the base64 image string from the request body
    if (!image) {
      return res.status(400).send("Image not provided");
    }

    // 🧼 Step 1: Face restoration with GFPGAN
    console.log("🧼 Restoring face with GFPGAN...");
    const restoredOutput = await replicate.run(
      "colinmcdonnell22/ghiblify:b4014c6ade5c1ac4c0d90ee5ea26ee9cf56ad28ee8a705737a0be6cdfdc3ac2a",
      {
        input: {
          image:image,
          model: "dev",
          prompt: "recreate this image in the style of ghibli holding a drink name clearup",
          go_fast: false,
          lora_scale: 0.95,
          megapixels: "1",
          num_outputs: 1,

          output_format: "jpg",
          guidance_scale: 3.5,
          output_quality: 100,
          prompt_strength: 0.65,
          extra_lora_scale: 1,
          num_inference_steps: 32,
        },
      }
    );

    const restoredImageURL = restoredOutput[0].url().href;
    console.log("Restored image URL:", restoredImageURL);

    if (!restoredImageURL || !restoredImageURL.startsWith("http")) {
      throw new Error("Invalid GFPGAN output: must be a valid image URL.");
    }

    res.json({ image: restoredImageURL });

  } catch (err) {
    console.error("❌ Final error:", err.message);
    res.status(500).send("Something went wrong.");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  const ipAddress = ip.address();
  console.log(`🚀 Server is running at http://${ipAddress}:${PORT}`);
});