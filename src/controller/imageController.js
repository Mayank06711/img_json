import extractDataFromImage from "../utils/ocrService.js";

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }
    
    // Return the file path that can be used for parsing
    res.status(200).json({ 
      message: "Image uploaded successfully",
      imagePath: req.file.path
    });
  } catch (error) {
    res.status(500).json({ error: "Error uploading image" });
  }
};

const parseImage = async (req, res) => {
  try {
    if (!req.body.imagePath) {
      return res.status(400).json({ error: "No image path provided" });
    }

    const data = await extractDataFromImage(req.body.imagePath);
    res.json(data);
  } catch (err) {
    console.error("Error processing image:", err);
    res.status(500).json({ error: "Error processing image" });
  }
};

export { uploadImage, parseImage };