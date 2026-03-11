import mongoose, { Schema } from "mongoose";

const transactionSchema = new Schema(
  {
    transactionType: {
      type: String,
        enum: ["transfer", "ngo-registration", "withdrawal", "case-donation", "product-donation"],
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // always required
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.transactionType !== "ngo-registration";
      },
    },
    amount: {
      type: Number,
      required: function () {
        // required for transfer and withdrawal only
        return this.transactionType !== "temple-registration";
      },
      min: 0,
    },
    txHash: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "failed"],
      default: "pending",
    },
    gasPrice: {
      type: Number,
      required: true,
    },
    transactionFee: {
      type: Number,
      required: true,
    },
    purpose: {
      type: String,
      required: function () {
        // required for transfer and withdrawal only
        return this.transactionType !== "ngo-registration";
      },
    },
    // Reference to fundraising case (if case donation)
    fundraisingCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FundraisingCase",
      required: function () {
        return this.transactionType === "case-donation";
      },
    },
    // Reference to product (if product donation)
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: function () {
        return this.transactionType === "product-donation";
      },
      },
    // Reference to NGO
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NGO",
    },
    cryptoType: {
      type: String,
      required: true,
      default: "matic",
      lowercase: true, // Assuming MATIC for now, can be dynamic later
    },
  },
  {
    timestamps: true,
  }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
