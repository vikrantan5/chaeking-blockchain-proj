import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// user schema
const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Password is Required!!'],
        select: false,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        required: true,
        enum: ["superAdmin", "templeAdmin", "user"],
        default: "user",
    },
    refreshToken: {
        type: String,
        default: null,
        select: true,
    },
    resetOtp: {
        type: String,
        select: false,
    },
    resetOtpExpires: {
        type: Date,
        select: false,
    },
    lastOtpSentAt: {
        type: Date,
        select: false,
    },
    templeName: {
        type: String,
    },
    templeLocation: {
        type: String,
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'suspended'],
        default: 'active'
    },
    loginType: {
        type: String,
        enum: ['email', 'google', 'facebook', 'phone'],
        required: true
    },
    walletAddress: {
        type: String,
        lowercase: true,
        trim: true,
        default: null,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: false
    }
}, {
    timestamps: true,
});

// bcrypt - password encryption 
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

// Access Tokes 
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

// Refresh Toknes 
userSchema.methods.generateRefreshToken = function () {
    const refreshToken = jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY

        }
    )
    return refreshToken;
}

export const User = mongoose.model("User", userSchema)