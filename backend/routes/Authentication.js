import bcrypt from "bcrypt";
import express from "express";
import multer from "multer";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../config/cloudinary.js";
import { User } from "../models/User.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Register route
router.post("/register", upload.single("image"), async (req, res) => {
  try {
    const { fullname, email, phoneNo, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullname,
      email,
      phoneNo,
      password: hashedPassword,
    });

    const response = await newUser.save();
    const userWithoutPassword = response.toObject();
    delete userWithoutPassword.password;
    req.session.user = userWithoutPassword;
    res.json({ message: "Registration successful", user: req.session.user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { identity, password } = req.body;
    let user;
    if (identity.includes("@")) {
      user = await User.findOne({ email: identity });
    } else {
      user = await User.findOne({ phoneNo: identity });
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;
    req.session.user = userWithoutPassword;
    res.json({ message: "Login successful", user: req.session.user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET current user profile
router.get("/me", (req, res) => {
  if (req.session?.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

// Logout route
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

// Edit profile route
router.put("/edit-profile", upload.single("profilePic"), async (req, res) => {
  try {
    const userId = req.session?.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { fullname, email, phoneNo, gender, dob, password } = req.body;

    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (phoneNo) user.phoneNo = phoneNo;
    if (gender) user.gender = gender;
    if (dob) user.dob = new Date(dob);

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    // If a new profile picture is uploaded, update it in Cloudinary
    if (req.file) {
      // Delete old profile picture from Cloudinary if exists
      if (user.profilePicUrl && user.cloudinaryPublicId) {
        try {
          await deleteFromCloudinary(user.cloudinaryPublicId);
        } catch (error) {
          console.log("Error deleting old image from Cloudinary:", error);
        }
      }

      try {
        const filename = `${Date.now()}_${req.file.originalname.replace(
          /\.[^/.]+$/,
          ""
        )}`;
        const result = await uploadToCloudinary(
          req.file.buffer,
          "users",
          filename
        );
        user.profilePicUrl = result.secure_url;
        user.cloudinaryPublicId = result.public_id;
      } catch (error) {
        console.log("Error uploading image to Cloudinary:", error);
      }
    }

    await user.save();
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;
    req.session.user = userWithoutPassword;
    console.log(userWithoutPassword);
    res
      .status(200)
      .json({
        message: "Profile updated successfully",
        user: userWithoutPassword,
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete profile picture route
router.delete("/delete-profile-pic", async (req, res) => {
  try {
    const userId = req.session?.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete the image from Cloudinary if profilePicUrl exists
    if (user.profilePicUrl && user.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(user.cloudinaryPublicId);
      } catch (error) {
        console.log("Error deleting image from Cloudinary:", error);
      }
    }
    user.cloudinaryPublicId = undefined;

    // Remove the profilePicUrl from the user document
    user.profilePicUrl = undefined;
    await user.save();
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;
    req.session.user = userWithoutPassword;

    res.status(200).json({
      message: "Profile picture deleted successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
