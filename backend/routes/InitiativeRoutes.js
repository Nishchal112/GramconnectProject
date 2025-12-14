import express from "express";
import multer from "multer";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { Initiative } from "../models/Initiative.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Create initiative route with Cloudinary image upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, description, id: userId } = req.body;
    let imageUrl;

    if (req.file) {
      // Upload to Cloudinary
      const filename = `${Date.now()}_${req.file.originalname.replace(
        /\.[^/.]+$/,
        ""
      )}`;
      const result = await uploadToCloudinary(
        req.file.buffer,
        "initiatives",
        filename
      );
      imageUrl = result.secure_url;
    }

    const initiativeData = {
      title: name,
      description,
      user: userId,
      ...(imageUrl && { imageUrl }),
    };

    const newInitiative = new Initiative(initiativeData);
    const savedInitiative = await newInitiative.save();
    await savedInitiative.populate("user");
    console.log("Initiative created successfully:", savedInitiative);
    res
      .status(201)
      .json({
        message: "Initiative created successfully!",
        initiative: savedInitiative,
      });
  } catch (error) {
    console.error("Error creating initiative:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const initiatives = await Initiative.find()
      .sort({ _id: -1 })
      .populate("user");
    res.json(initiatives);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get the Cloudinary image URL for a specific initiative
router.get("/image/:id", async (req, res) => {
  try {
    const initiative = await Initiative.findById(req.params.id);
    if (!initiative || !initiative.imageUrl)
      return res.status(404).send("Image not found");
    // Return the image URL
    res.json({ imageUrl: initiative.imageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/vote/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const initiative = await Initiative.findById(req.params.id);
    if (!initiative)
      return res.status(404).json({ message: "Initiative not found" });

    const index = initiative.likedBy.findIndex(
      (id) => id.toString() === userId
    );
    if (index > -1) {
      initiative.likedBy.splice(index, 1);
      initiative.voteCount = Math.max(initiative.voteCount - 1, 0);
    } else {
      initiative.likedBy.push(userId);
      initiative.voteCount += 1;
    }
    await initiative.save();
    res.json({
      initiativeId: initiative._id,
      voteCount: initiative.voteCount,
      likedBy: initiative.likedBy,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/comment/:id", async (req, res) => {
  try {
    const initiative = await Initiative.findById(req.params.id);
    if (!initiative)
      return res.status(404).json({ message: "Initiative not found" });
    res.json(initiative.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/comment/:id", async (req, res) => {
  try {
    const { userId, comment } = req.body;
    const initiative = await Initiative.findById(req.params.id);
    if (!initiative)
      return res.status(404).json({ message: "Initiative not found" });

    const newComment = {
      user: userId,
      comment,
      createdAt: new Date(),
    };
    initiative.comments = [...(initiative.comments || []), newComment];
    initiative.commentCount = initiative.comments.length;
    await initiative.save();
    res
      .status(201)
      .json({
        message: "Comment added successfully!",
        comments: initiative.comments,
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
