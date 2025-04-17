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
const PORT = process.env.PORT || 9000;

// Middleware
app.use(express.json({ limit: "10mb" })); // ⬅️ support large base64 uploads
app.use(cors());

// Replicate instance
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});
app.get("/", (req, res) => {
  res.send("Hello from the server2!");
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
      "jingyunliang/restoreformer:8ea27d61c5cb62f32dc6c56b0d6f73eb7d25a232c41df1cbcff1ff423405a47c",
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
    


        const output2 = await replicate.run(
          "piddnad/ddcolor:ca494ba129e44e45f661d6ece83c4c98a9a7c774309beca01429b58fce8aa695",
          {
            input: {
              image: restoredImageURL,
              model_size: "large",
            },
          }
        );

    const colorizedImageURL = output2.url().href;
    console.log("🎨 Colorized image URL:", colorizedImageURL)
    if (!colorizedImageURL || !colorizedImageURL.startsWith("http")) {
      throw new Error("Invalid colorized image URL from Replicate.");
    }
    res.json({ image: colorizedImageURL });
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
