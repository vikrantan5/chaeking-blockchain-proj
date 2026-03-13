"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus, Trash2, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { apiClient } from "../../utils/api";


const categories = ["food", "medicine", "education", "clothing", "shelter", "emergency-kit", "other"];

export default function SuperAdminProductsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [approvedNgos, setApprovedNgos] = useState<any[]>([]);
  const [stockDrafts, setStockDrafts] = useState<Record<string, number>>({});
  const [form, setForm] = useState({
    productName: "",
    category: "food",
    description: "",
    priceInCrypto: "",
    stockQuantity: "",
    associatedNGO: "",
    specifications: "",
  });
  const [images, setImages] = useState<FileList | null>(null);

  const totalProducts = useMemo(() => products.length, [products]);

  useEffect(() => {
    const user = localStorage.getItem("user_data");
    if (!user || JSON.parse(user).role !== "superAdmin") {
      toast.error("Access denied. Super Admin only.");
      router.push("/superadminlogin");
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [productsResult, ngoResult] = await Promise.all([
        apiClient.products.getAll(),
        apiClient.ngos.getAll({ status: "approved", limit: 200 }),
      ]);

      if (productsResult.success) {
        setProducts(Array.isArray(productsResult.data) ? productsResult.data : []);
      }

      if (ngoResult.success) {
        const ngoList = Array.isArray(ngoResult.data) ? ngoResult.data : ngoResult.data?.ngos || [];
        setApprovedNgos(ngoList);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load product management data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!form.productName || !form.category || !form.description || !form.priceInCrypto || !form.stockQuantity) {
      toast.error("Please fill all required product fields");
      return;
    }

    const formData = new FormData();
    formData.append("productName", form.productName);
    formData.append("category", form.category);
    formData.append("description", form.description);
    formData.append("priceInCrypto", form.priceInCrypto);
    formData.append("stockQuantity", form.stockQuantity);
    if (form.associatedNGO) {
      formData.append("associatedNGO", form.associatedNGO);
    }
    if (form.specifications) {
      formData.append("specifications", form.specifications);
    }
    if (images?.length) {
      Array.from(images).forEach((file) => formData.append("images", file));
    }

    try {
      setSaving(true);
      const result = await apiClient.products.create(formData);
      if (!result.success) {
        toast.error(result.message || "Unable to create product");
        return;
      }

      toast.success("Product created successfully");
      setForm({
        productName: "",
        category: "food",
        description: "",
        priceInCrypto: "",
        stockQuantity: "",
        associatedNGO: "",
        specifications: "",
      });
      setImages(null);
      await fetchAll();
    } catch (error) {
      console.error(error);
      toast.error("Error creating product");
    } finally {
      setSaving(false);
    }
  };

  const handleStockUpdate = async (productId: string) => {
    const quantity = stockDrafts[productId];
    if (quantity === undefined || quantity < 0) {
      toast.error("Please enter valid stock quantity");
      return;
    }

    const result = await apiClient.products.updateStock(productId, quantity);
    if (!result.success) {
      toast.error(result.message || "Failed to update stock");
      return;
    }

    toast.success("Stock updated");
    await fetchAll();
  };

  const handleDelete = async (productId: string) => {
    const confirmation = window.confirm("Are you sure you want to delete this product?");
    if (!confirmation) return;

    const result = await apiClient.products.delete(productId);
    if (!result.success) {
      toast.error(result.message || "Failed to delete product");
      return;
    }

    toast.success("Product deleted");
    await fetchAll();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="superadmin-products-loading">
        <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6" data-testid="superadmin-products-page">
      <div className="max-w-7xl mx-auto space-y-8">
         <button
          onClick={() => router.push("/superadmin/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          data-testid="back-to-dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold text-gray-800" data-testid="superadmin-products-title">Product Management</h1>
            <p className="text-gray-600 mt-1" data-testid="superadmin-products-total-count">Total products: {totalProducts}</p>
          </div>
          <button
            onClick={fetchAll}
            className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            data-testid="superadmin-products-refresh-button"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4" data-testid="superadmin-create-product-form">
          <h2 className="text-2xl font-semibold text-gray-800">Create Product</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              value={form.productName}
              onChange={(e) => setForm((prev) => ({ ...prev, productName: e.target.value }))}
              placeholder="Product name"
              className="border border-gray-300 rounded-lg px-3 py-2"
              data-testid="superadmin-product-name-input"
            />
            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2"
              data-testid="superadmin-product-category-select"
            >
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <input
              value={form.priceInCrypto}
              onChange={(e) => setForm((prev) => ({ ...prev, priceInCrypto: e.target.value }))}
              placeholder="Price in MATIC"
              type="number"
              className="border border-gray-300 rounded-lg px-3 py-2"
              data-testid="superadmin-product-price-input"
            />
            <input
              value={form.stockQuantity}
              onChange={(e) => setForm((prev) => ({ ...prev, stockQuantity: e.target.value }))}
              placeholder="Stock quantity"
              type="number"
              className="border border-gray-300 rounded-lg px-3 py-2"
              data-testid="superadmin-product-stock-input"
            />
            <select
              value={form.associatedNGO}
              onChange={(e) => setForm((prev) => ({ ...prev, associatedNGO: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2"
              data-testid="superadmin-product-ngo-select"
            >
              <option value="">Any approved NGO</option>
              {approvedNgos.map((ngo) => (
                <option key={ngo._id} value={ngo._id}>{ngo.ngoName}</option>
              ))}
            </select>
            <input
              onChange={(e) => setImages(e.target.files)}
              type="file"
              multiple
              accept="image/*"
              className="border border-gray-300 rounded-lg px-3 py-2"
              data-testid="superadmin-product-images-input"
            />
          </div>
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Product description"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            data-testid="superadmin-product-description-input"
          />
          <textarea
            value={form.specifications}
            onChange={(e) => setForm((prev) => ({ ...prev, specifications: e.target.value }))}
            placeholder="Specifications (optional)"
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            data-testid="superadmin-product-specification-input"
          />
          <button
            onClick={handleCreateProduct}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-lg px-5 py-2 hover:bg-blue-700 disabled:opacity-60"
            data-testid="superadmin-product-create-button"
          >
            <Plus className="w-4 h-4" /> {saving ? "Creating..." : "Create Product"}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6" data-testid="superadmin-products-list">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">All Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3">Name</th>
                  <th className="py-3">Category</th>
                  <th className="py-3">NGO</th>
                  <th className="py-3">Price</th>
                  <th className="py-3">Stock</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr className="border-b border-gray-100" key={product._id} data-testid={`superadmin-product-row-${product._id}`}>
                    <td className="py-3">
                      <p className="font-medium text-gray-800" data-testid={`superadmin-product-name-${product._id}`}>{product.productName}</p>
                      <p className="text-xs text-gray-500">{product.totalDonated || 0} donated</p>
                    </td>
                    <td className="py-3 capitalize">{product.category}</td>
                    <td className="py-3">{product.associatedNGO?.ngoName || "Any NGO"}</td>
                    <td className="py-3">{product.priceInCrypto} MATIC</td>
                    <td className="py-3">{product.stockQuantity}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          defaultValue={product.stockQuantity}
                          onChange={(e) =>
                            setStockDrafts((prev) => ({ ...prev, [product._id]: Number(e.target.value) }))
                          }
                          className="w-24 border border-gray-300 rounded px-2 py-1"
                          data-testid={`superadmin-product-stock-edit-${product._id}`}
                        />
                        <button
                          onClick={() => handleStockUpdate(product._id)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          data-testid={`superadmin-product-stock-update-${product._id}`}
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                          data-testid={`superadmin-product-delete-${product._id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="text-center py-10 text-gray-500" data-testid="superadmin-products-empty-state">
                <Package className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                No products created yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}