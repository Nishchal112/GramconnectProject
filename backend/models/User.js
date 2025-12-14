import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNo: {
    type: String,
    required: true,
    unique: true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female"],
  },
  dob: {
    type: Date,
  },
  // Store the Cloudinary URL
  profilePicUrl: {
    type: String,
  },
  // Store the Cloudinary public ID for deletion
  cloudinaryPublicId: {
    type: String,
  },
});

export const User = mongoose.model("User", userSchema);
