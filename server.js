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

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // To handle large base64 payloads
const PORT = process.env.PORT || 9080;
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
      "colinmcdonnell22/ghiblify-3:407b7fd425e00eedefe7db3041662a36a126f1e4988e6fbadfc49b157159f015",
      {
        input: {
          image: image,
          model: "dev",
          prompt: "recreate this image in ghibli style",
          go_fast: false,
          lora_scale: 0.85,
          megapixels: "1",
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "jpg",
          guidance_scale: 3,
          output_quality: 100,
          prompt_strength: 0.7,
          extra_lora_scale: 1,
          num_inference_steps: 28,
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