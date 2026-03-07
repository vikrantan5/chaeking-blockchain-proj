"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import confetti from "canvas-confetti";
import { toast } from "react-toastify";
import { Download, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import jsPDF from "jspdf";

export default function ReceiptPage() {
  const searchParams = useSearchParams();
  const txHash = searchParams.get("txHash");

  const [donation, setDonation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!txHash) return;

    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      toast.error("You must be logged in to view this receipt.");
      return;
    }

    const fetchReceipt = async () => {
      try {
        setLoading(true);

        const API_BASE_URL = "http://localhost:5050/api/v1";

        const res = await axios.get(
          `${API_BASE_URL}/transactions/receipt?txHash=${txHash}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = res.data.data;
        if (data.transactionType !== "transfer") {
          toast.error("Invalid transaction type for donation receipt.");
          return;
        }

        setDonation(data);
        confetti();
      } catch (error: any) {
        console.error("Fetch receipt error:", error);
        toast.error(
          error?.response?.data?.message || "Failed to fetch receipt."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [txHash]);

  const downloadPdf = () => {
    if (!donation) return;

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Temple Donation Receipt", 20, 20);
    doc.setFontSize(11);

    const fields = [
      ["Transaction Hash", donation.txHash],
      ["Sender Name", donation.sender.name],
      ["Sender Wallet", donation.sender.walletAddress],
      ["Temple Name", donation.receiver.templeName],
      ["Temple Location", donation.receiver.templeLocation],
      ["Temple Wallet", donation.receiver.walletAddress],
      ["Amount (POL)", donation.amount],
      ["Purpose", donation.purpose],
      ["Gas Price (Gwei)", donation.gasPrice],
      ["Transaction Fee", donation.transactionFee],
      ["Timestamp", new Date(donation.createdAt).toLocaleString()],
    ];

    let y = 30;
    fields.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 20, y);
      y += 8;
    });

    doc.save(`Donation_Receipt_${donation.txHash}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600">
        <Loader2 className="animate-spin w-6 h-6 mr-2" /> Loading Receipt...
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="text-center text-red-500 mt-10">
        Transaction not found or invalid.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 mt-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-6 h-6" />
          Donation Successful!
        </h1>
        <button
          onClick={downloadPdf}
          className="flex items-center text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          <Download className="w-4 h-4 mr-1" />
          Download PDF
        </button>
      </div>

      <div className="space-y-2 text-sm text-gray-700">
        <p>
          <strong>Tx Hash:</strong> {donation.txHash}
        </p>
        <p>
          <strong>Name:</strong> {donation.sender.name}
        </p>
        <p>
          <strong>Wallet Address:</strong> {donation.sender.walletAddress}
        </p>
        <p>
          <strong>Temple Name:</strong> {donation.receiver.templeName}
        </p>
        <p>
          <strong>Temple Location:</strong> {donation.receiver.templeLocation}
        </p>
        <p>
          <strong>Temple Wallet:</strong> {donation.receiver.walletAddress}
        </p>
        <p>
          <strong>Amount:</strong> {donation.amount} POL
        </p>
        <p>
          <strong>Purpose:</strong> {donation.purpose}
        </p>
        <p>
          <strong>Gas Price:</strong> {donation.gasPrice} Gwei
        </p>
        <p>
          <strong>Transaction Fee:</strong> {donation.transactionFee} POL
        </p>
        <p>
          <strong>Timestamp:</strong>{" "}
          {new Date(donation.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="mt-6 text-sm text-blue-600">
        <a
          href={`https://amoy.polygonscan.com/tx/${donation.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center hover:underline"
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          View on PolygonScan
        </a>
      </div>
    </div>
  );
}
