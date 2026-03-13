"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Download, FileText, ArrowLeft, Calendar, DollarSign } from "lucide-react";
import { apiClient } from "../../utils/api";
import html2pdf from "html2pdf.js";

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");
    const userRole = localStorage.getItem("user_role");
    
    if (!accessToken || userRole !== "user") {
      router.push("/login");
      return;
    }

    loadPaymentHistory();
  }, [router]);

  const loadPaymentHistory = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user_data") || "{}");
      setUserData(user);

      const result = await apiClient.transactions.getPaymentHistory();
      if (result.success) {
        setPayments(result.data || []);
      } else {
        toast.error("Failed to load payment history");
      }
    } catch (error) {
      console.error("Error loading payment history:", error);
      toast.error("Error loading payment history");
    } finally {
      setIsLoading(false);
    }
  };

  const generateReceipt = (payment: any) => {
    const receiptHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; border: 2px solid #f97316;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f97316; margin: 0;">Donation Receipt</h1>
          <p style="color: #666; margin-top: 10px;">Thank you for your generous contribution!</p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #374151; margin-top: 0;">Receipt Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Receipt Number:</td>
              <td style="padding: 8px 0; font-weight: bold;">${payment._id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Date:</td>
              <td style="padding: 8px 0; font-weight: bold;">${new Date(payment.createdAt).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Transaction Hash:</td>
              <td style="padding: 8px 0; font-weight: bold; word-break: break-all;">${payment.txHash}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #92400e; margin-top: 0;">Donation Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #92400e;">Type:</td>
              <td style="padding: 8px 0; font-weight: bold;">${payment.transactionType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #92400e;">Amount:</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 20px; color: #f97316;">${payment.amount} ${payment.cryptoType.toUpperCase()}</td>
            </tr>
            ${payment.ngo ? `
            <tr>
              <td style="padding: 8px 0; color: #92400e;">NGO:</td>
              <td style="padding: 8px 0; font-weight: bold;">${payment.ngo.ngoName}</td>
            </tr>
            ` : ''}
            ${payment.fundraisingCase ? `
            <tr>
              <td style="padding: 8px 0; color: #92400e;">Case:</td>
              <td style="padding: 8px 0; font-weight: bold;">${payment.fundraisingCase.title}</td>
            </tr>
            ` : ''}
            ${payment.product ? `
            <tr>
              <td style="padding: 8px 0; color: #92400e;">Product:</td>
              <td style="padding: 8px 0; font-weight: bold;">${payment.product.productName}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280;">
          <p>This is a computer-generated receipt and does not require a signature.</p>
          <p style="margin-top: 10px;">Thank you for supporting our cause! Your contribution makes a difference.</p>
        </div>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = receiptHTML;
    
    const opt = {
      margin: 10,
      filename: `donation-receipt-${payment._id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
    toast.success("Receipt downloaded successfully!");
  };

  const getDonationTypeLabel = (type: string) => {
    switch (type) {
      case 'ngo-donation':
        return 'NGO Donation';
      case 'case-donation':
        return 'Case Donation';
      case 'product-donation':
        return 'Product Donation';
      default:
        return type;
    }
  };

  const getDonationTypeColor = (type: string) => {
    switch (type) {
      case 'ngo-donation':
        return 'bg-blue-100 text-blue-800';
      case 'case-donation':
        return 'bg-green-100 text-green-800';
      case 'product-donation':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push("/user/dashboard")}
            className="flex items-center text-gray-600 hover:text-orange-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600 mt-1">View all your donation transactions and download receipts</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {payments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Payment History</h3>
            <p className="text-gray-600 mb-6">You haven't made any donations yet</p>
            <button
              onClick={() => router.push("/ngos")}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Start Donating
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDonationTypeColor(payment.transactionType)}`}>
                        {getDonationTypeLabel(payment.transactionType)}
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Confirmed
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-orange-600" />
                        <span className="text-2xl font-bold text-gray-900">
                          {payment.amount} {payment.cryptoType.toUpperCase()}
                        </span>
                      </div>
                      
                      {payment.ngo && (
                        <p className="text-gray-600">
                          <span className="font-medium">NGO:</span> {payment.ngo.ngoName}
                        </p>
                      )}
                      
                      {payment.fundraisingCase && (
                        <p className="text-gray-600">
                          <span className="font-medium">Case:</span> {payment.fundraisingCase.title}
                        </p>
                      )}
                      
                      {payment.product && (
                        <p className="text-gray-600">
                          <span className="font-medium">Product:</span> {payment.product.productName}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(payment.createdAt).toLocaleString()}
                      </div>
                      
                      <p className="text-xs text-gray-400 font-mono break-all">
                        TX: {payment.txHash}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <button
                      onClick={() => generateReceipt(payment)}
                      className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      Download Receipt
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
