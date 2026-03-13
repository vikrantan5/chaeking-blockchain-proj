"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Package, ShoppingCart, ArrowLeft, CheckCircle, Info } from "lucide-react";
import { apiClient } from "../../utils/api";
import { toast } from "react-toastify";

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [ngos, setNgos] = useState<any[]>([]);
  const [selectedNgoId, setSelectedNgoId] = useState("");

  useEffect(() => {
    if (slug) {
      fetchProductDetails();
      fetchApprovedNGOs();
    }
  }, [slug]);

  const fetchProductDetails = async () => {
    try {
      const result = await apiClient.products.getById(slug);
      if (result.success) {
        setProduct(result.data);
      } else {
        toast.error("Product not found");
        router.push("/products");
      }
    } catch (err) {
      console.error("Error fetching product:", err);
      toast.error("Error loading product details");
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedNGOs = async () => {
    try {
      const result = await apiClient.ngos.getAll({ approvalStatus: 'approved' });
      if (result.success) {
        setNgos(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching NGOs:", err);
    }
  };

  const handleDonate = async () => {
    const totalPrice = product.priceInCrypto * quantity;

    if (quantity <= 0 || quantity > product.stockQuantity) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (!selectedNgoId) {
      toast.error("Please select an NGO to donate to");
      return;
    }

    const selectedNgo = ngos.find(ngo => ngo._id === selectedNgoId);
    if (!selectedNgo) {
      toast.error("Selected NGO not found");
      return;
    }

    const ngoWalletAddress = selectedNgo.walletAddress || selectedNgo.registeredBy?.walletAddress;
    if (!ngoWalletAddress) {
      toast.error("NGO wallet address not found");
      return;
    }

    const accessToken = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
    const userData = localStorage.getItem("user_data");
    if (!accessToken || !userData || JSON.parse(userData).role !== "user") {
      toast.error("Please login as user to donate");
      router.push("/login");
      return;
    }

    try {
      const { ethers } = await import("ethers");

      // Check MetaMask
      if (typeof window === "undefined" || !(window as any).ethereum) {
        toast.error("Please install MetaMask to donate");
        window.open("https://metamask.io/download.html", "_blank");
        return;
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      // Get contract
      const contractAddress = process.env.NEXT_PUBLIC_NGO_FUND_ADDRESS;
      if (!contractAddress) {
        toast.error("Contract address not configured");
        return;
      }

      const contractABI = [
        "function donateProduct(bytes32 productId, address ngo) payable"
      ];
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Convert product ID to bytes32
      const productIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(product._id));

      toast.info("Please confirm the transaction in MetaMask...");

      // Send donation
      const tx = await contract.donateProduct(
        productIdBytes32,
        ngoWalletAddress,
        { value: ethers.parseEther(totalPrice.toString()) }
      );

      toast.info("Transaction submitted. Waiting for confirmation...");
      const receipt = await tx.wait();
      const receiptAny = receipt as any;
      const txAny = tx as any;
      const gasPrice = receiptAny?.gasPrice ?? receiptAny?.effectiveGasPrice ?? txAny?.gasPrice ?? 0n;
      const gasUsed = receiptAny?.gasUsed ?? 0n;
      const transactionFee = gasUsed * gasPrice;

      // Record in backend
      const saveResult = await apiClient.products.donate(product._id, {
        ngoId: selectedNgoId,
        txHash: receipt.hash,
        gasPrice: Number(gasPrice),
        transactionFee: Number(transactionFee),
        quantity,
      });

      if (!saveResult.success) {
        toast.error(saveResult.message || "Donation confirmed on-chain but save failed");
        return;
      }

      toast.success(`Product donation successful to ${selectedNgo.ngoName}! Thank you! 🎉`);
      setQuantity(1);
      setSelectedNgoId("");
      
      // Refresh product details
      await fetchProductDetails();
    } catch (error: any) {
      console.error("Donation error:", error);
      if (error.code === 4001) {
        toast.error("Transaction rejected by user");
      } else {
        toast.error(error.message || "Donation failed. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">Product not found</div>;
  }

  const totalPrice = product.priceInCrypto * quantity;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Back Button */}
      <div className="container mx-auto px-6 py-6">
        <button
          onClick={() => router.push("/products")}
          className="flex items-center text-gray-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Products
        </button>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.productName}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-r from-orange-400 to-yellow-400 flex items-center justify-center">
                  <Package className="w-32 h-32 text-white opacity-30" />
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((image: string, index: number) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Product ${index + 2}`}
                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium capitalize">
                  {product.category}
                </span>
                {product.isAvailable && product.stockQuantity > 0 ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    In Stock
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    Out of Stock
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold text-gray-800 mb-4">{product.productName}</h1>
              <p className="text-2xl font-bold text-orange-600 mb-4">
                {product.priceInCrypto} {product.cryptoType.toUpperCase()} per unit
              </p>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-3 text-gray-800">Description</h2>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Specifications */}
            {product.specifications && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-3 text-gray-800">Specifications</h2>
                <p className="text-gray-600 leading-relaxed">{product.specifications}</p>
              </div>
            )}

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Product Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Stock:</span>
                  <span className="font-bold text-gray-800">{product.stockQuantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Times Donated:</span>
                  <span className="font-bold text-gray-800">{product.totalDonated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Crypto Type:</span>
                  <span className="font-bold text-gray-800">{product.cryptoType.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Donation Card */}
            {product.isAvailable && product.stockQuantity > 0 && (
              <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-4">Donate This Product</h2>
                
                <div className="bg-white/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5" />
                    <span className="font-medium">Select an NGO to donate this product to</span>
                  </div>
                </div>

                {/* NGO Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Select NGO *</label>
                  <select
                    value={selectedNgoId}
                    onChange={(e) => setSelectedNgoId(e.target.value)}
                    className="w-full px-4 py-3 border border-white/30 bg-white/10 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 outline-none"
                  >
                    <option value="" className="text-gray-800">Choose an NGO...</option>
                    {ngos.map((ngo) => (
                      <option key={ngo._id} value={ngo._id} className="text-gray-800">
                        {ngo.ngoName} - {ngo.address?.city || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                    max={product.stockQuantity}
                    className="w-full px-4 py-3 border border-white/30 bg-white/10 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 outline-none"
                  />
                </div>

                <div className="bg-white/20 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg">Total Cost:</span>
                    <span className="text-2xl font-bold">
                      {totalPrice.toFixed(4)} {product.cryptoType.toUpperCase()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleDonate}
                  disabled={!selectedNgoId}
                  className="w-full bg-white text-orange-600 py-4 rounded-lg font-bold text-lg hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-6 h-6" />
                  Donate {quantity} {quantity > 1 ? 'Items' : 'Item'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
