import express from "express";
import multer from "multer";
import axios from "axios";
import ip from "ip";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Replicate from "replicate";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: path.join(__dirname, "uploads") });
const PORT = process.env.PORT || 5000;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.post("/imageApi", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;

    // Convert image to base64
    const imageData = fs.readFileSync(filePath, { encoding: "base64" });
    const imageBase64 = `data:image/jpeg;base64,${imageData}`;

    // 🧼 Step 1: Face restoration with GFPGAN
    console.log("🧼 Restoring face with GFPGAN...");
  
    // 🎨 Step 2: Colorization with DeOldify
    console.log("🎨 Colorizing image with DeOldify...");
    const colorizedOutput = await replicate.run(
      "arielreplicate/deoldify_image:0da600fab0c45a66211339f1c16b71345d22f26ef5fea3dca1bb90bb5711e950",
      {
        input: {
          model_name: "Stable",
          input_image: imageBase64,
          render_factor: 35,
        },
      }
    );

   console.log("Colorized image URL:", colorizedOutput.url().href);


    res.json({ image: colorizedOutput.url().href });
  } catch (err) {
    console.error("❌ Final error:", err.message);
    res.status(500).send("Something went wrong.");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  const ipAddress = ip.address();
  console.log(`🚀 Server is running at http://${ipAddress}:${PORT}`);
});
