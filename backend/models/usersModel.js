const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "company", "admin"], default: "user", required: true },
    companyName: { type: String, unique: true, sparse: true },
    address: { type: String }, // ✅ nouveau champ
    phone: { type: String }, // ✅ nouveau champ
    isBlocked: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
