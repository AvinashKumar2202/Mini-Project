import mongoose from "mongoose";

const mobileOtpSchema = new mongoose.Schema({
    mobileNumber: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600, // Document expires in 10 minutes (600 seconds)
    },
});

// Index for fast OTP lookup by mobile number
mobileOtpSchema.index({ mobileNumber: 1 });

const MobileOtp = mongoose.model("MobileOtp", mobileOtpSchema);
export default MobileOtp;
