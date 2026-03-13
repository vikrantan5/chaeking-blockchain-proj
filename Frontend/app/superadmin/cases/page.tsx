"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Plus, Calendar, Target, TrendingUp, Edit, Eye, DollarSign, Users, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "react-toastify";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api/v1";

export default function SuperAdminCasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);

  const [formData, setFormData] = useState({
    caseTitle: "",
    caseType: "medical",
    description: "",
    beneficiaryName: "",
    beneficiaryAge: "",
    beneficiaryLocation: "",
    beneficiaryStory: "",
    associatedNGO: "",
    targetAmount: "",
    deadline: "",
  });
const [caseImages, setCaseImages] = useState<FileList | null>(null);
  useEffect(() => {
    const user = localStorage.getItem("user_data");
    if (!user) {
      router.push("/login");
      return;
    }
    const userData = JSON.parse(user);
    if (userData.role !== 'superAdmin') {
      toast.error("Access denied. Super Admin only.");
      router.push("/");
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      
      // Fetch all cases
         const casesRes = await fetch(`${API_URL}/cases`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const casesData = await casesRes.json();
      
      // Fetch all approved NGOs
        const ngosRes = await fetch(`${API_URL}/ngos`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const ngosData = await ngosRes.json();
      
      if (casesData.success) {
        setCases(casesData.data || []);
      }
      
      if (ngosData.success) {
        const approvedNGOs = Array.isArray(ngosData.data) 
          ? ngosData.data.filter((ngo: any) => ngo.approvalStatus === 'approved')
          : (ngosData.data?.ngos || []).filter((ngo: any) => ngo.approvalStatus === 'approved');
        setNgos(approvedNGOs);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("accessToken");
      
      const beneficiaryDetails = {
        name: formData.beneficiaryName,
        age: parseInt(formData.beneficiaryAge) || 0,
        location: formData.beneficiaryLocation,
        story: formData.beneficiaryStory
      };

        const submitData = new FormData();
      submitData.append("caseTitle", formData.caseTitle);
      submitData.append("caseType", formData.caseType);
      submitData.append("description", formData.description);
      submitData.append("beneficiaryDetails", JSON.stringify(beneficiaryDetails));
      submitData.append("associatedNGO", formData.associatedNGO);
      submitData.append("targetAmount", formData.targetAmount);
      submitData.append("deadline", formData.deadline);

      // Append images if selected
      if (caseImages && caseImages.length > 0) {
        for (let i = 0; i < caseImages.length; i++) {
          submitData.append("images", caseImages[i]);
        }
      }

      const response = await fetch(`${API_URL}/cases/create`, {
        method: "POST",
        headers: {
         
          "Authorization": `Bearer ${token}`
        },
        body: submitData
        
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Fundraising case created successfully!");
        setShowCreateModal(false);
        setCaseImages(null);
        setFormData({
          caseTitle: "",
          caseType: "medical",
          description: "",
          beneficiaryName: "",
          beneficiaryAge: "",
          beneficiaryLocation: "",
          beneficiaryStory: "",
          associatedNGO: "",
          targetAmount: "",
          deadline: "",
        });
        fetchData();
      } else {
        toast.error(data.message || "Failed to create case");
      }
    } catch (err) {
      console.error("Error creating case:", err);
      toast.error("Error creating case");
    }
  };

  const handleEditCase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("accessToken");

          const submitData = new FormData();
      submitData.append("targetAmount", formData.targetAmount);
      submitData.append("deadline", formData.deadline);

      // Append new images if selected
      if (caseImages && caseImages.length > 0) {
        for (let i = 0; i < caseImages.length; i++) {
          submitData.append("images", caseImages[i]);
        }
      }

      
        const response = await fetch(`${API_URL}/cases/${selectedCase._id}`, {
        method: "PUT",
        headers: {
          
          "Authorization": `Bearer ${token}`
        },
        body: submitData
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Case updated successfully!");
        setShowEditModal(false);
        setSelectedCase(null);
         setCaseImages(null);
        fetchData();
      } else {
        toast.error(data.message || "Failed to update case");
      }
    } catch (err) {
      console.error("Error updating case:", err);
      toast.error("Error updating case");
    }
  };

  const openEditModal = (caseItem: any) => {
    setSelectedCase(caseItem);
    setFormData({
      ...formData,
      targetAmount: caseItem.targetAmount.toString(),
      deadline: new Date(caseItem.deadline).toISOString().split('T')[0]
    });
    setShowEditModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'expired': return 'bg-red-100 text-red-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeCases = cases.filter(c => c.status === 'active');
  const completedCases = cases.filter(c => c.status === 'completed');
  const totalRaised = cases.reduce((sum, c) => sum + (c.currentAmount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6" data-testid="superadmin-cases-page">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Heart className="w-10 h-10 text-red-600" />
              <div>
                <h1 className="text-4xl font-bold text-gray-800" data-testid="cases-title">Fundraising Cases</h1>
                <p className="text-gray-600">Manage and create fundraising campaigns</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
              data-testid="create-case-button"
            >
              <Plus className="w-5 h-5" />
              Create New Case
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total Cases</span>
              <Heart className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800" data-testid="total-cases">{cases.length}</p>
            <p className="text-xs text-gray-500 mt-1">{activeCases.length} active</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Active Cases</span>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800" data-testid="active-cases">{activeCases.length}</p>
            <p className="text-xs text-green-600 mt-1">Currently accepting donations</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Completed</span>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800" data-testid="completed-cases">{completedCases.length}</p>
            <p className="text-xs text-purple-600 mt-1">Goals achieved</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total Raised</span>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800" data-testid="total-raised">{totalRaised.toFixed(4)} MATIC</p>
            <p className="text-xs text-gray-500 mt-1">Across all cases</p>
          </div>
        </div>

        {/* Cases List */}
        <div className="bg-white rounded-xl shadow-lg p-6" data-testid="cases-list">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">All Cases</h2>
          
          {cases.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No fundraising cases yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create First Case
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((caseItem) => (
                <div key={caseItem._id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors" data-testid={`case-item-${caseItem._id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{caseItem.caseTitle}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                          {caseItem.status}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          {caseItem.caseType}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{caseItem.description}</p>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Beneficiary:</span> {caseItem.beneficiaryDetails?.name || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Location:</span> {caseItem.beneficiaryDetails?.location || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">NGO:</span> {caseItem.associatedNGO?.ngoName || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Target:</span> {caseItem.targetAmount} MATIC
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Raised:</span> {caseItem.currentAmount || 0} MATIC
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Progress:</span> {caseItem.progressPercentage || 0}%
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                            style={{ width: `${Math.min(caseItem.progressPercentage || 0, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Deadline: {new Date(caseItem.deadline).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{caseItem.totalDonors || 0} donors</span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => openEditModal(caseItem)}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center gap-2"
                        data-testid={`edit-case-${caseItem._id}`}
                      >
                        <Edit className="w-4 h-4" />
                        Edit Amount
                      </button>
                      <button
                        onClick={() => router.push(`/cases/${caseItem.slug}`)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
                        data-testid={`view-case-${caseItem._id}`}
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Create New Fundraising Case</h2>
            </div>
            
            <form onSubmit={handleCreateCase} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Case Title *</label>
                  <input
                    type="text"
                    name="caseTitle"
                    value={formData.caseTitle}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    data-testid="case-title-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Case Type *</label>
                  <select
                    name="caseType"
                    value={formData.caseType}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    data-testid="case-type-select"
                  >
                    <option value="medical">Medical</option>
                    <option value="emergency">Emergency</option>
                    <option value="education">Education</option>
                    <option value="disaster-relief">Disaster Relief</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  data-testid="case-description-input"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Beneficiary Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      name="beneficiaryName"
                      value={formData.beneficiaryName}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      data-testid="beneficiary-name-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                    <input
                      type="number"
                      name="beneficiaryAge"
                      value={formData.beneficiaryAge}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="beneficiary-age-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                    <input
                      type="text"
                      name="beneficiaryLocation"
                      value={formData.beneficiaryLocation}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      data-testid="beneficiary-location-input"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Story</label>
                  <textarea
                    name="beneficiaryStory"
                    value={formData.beneficiaryStory}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="beneficiary-story-input"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Associated NGO *</label>
                    <select
                      name="associatedNGO"
                      value={formData.associatedNGO}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      data-testid="associated-ngo-select"
                    >
                      <option value="">Select an NGO</option>
                      {ngos.map((ngo) => (
                        <option key={ngo._id} value={ngo._id}>
                          {ngo.ngoName} - {ngo.address?.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount (MATIC) *</label>
                    <input
                      type="number"
                      step="0.0001"
                      name="targetAmount"
                      value={formData.targetAmount}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      data-testid="target-amount-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deadline *</label>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      data-testid="deadline-input"
                    />
                  </div>
                       <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Case Images</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setCaseImages(e.target.files)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="case-images-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload images for this case (optional, multiple files allowed)</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold"
                  data-testid="submit-create-case"
                >
                  Create Case
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  data-testid="cancel-create-case"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Case Modal */}
      {showEditModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Edit Case Amount</h2>
              <p className="text-gray-600 mt-1">{selectedCase.caseTitle}</p>
            </div>
            
            <form onSubmit={handleEditCase} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount (MATIC) *</label>
                <input
                  type="number"
                  step="0.0001"
                  name="targetAmount"
                  value={formData.targetAmount}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  data-testid="edit-target-amount-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deadline *</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  data-testid="edit-deadline-input"
                />
              </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add More Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setCaseImages(e.target.files)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="edit-case-images-input"
                />
                <p className="text-xs text-gray-500 mt-1">Upload additional images (optional, multiple files allowed)</p>
                {selectedCase?.images && selectedCase.images.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">Current images: {selectedCase.images.length} image(s) uploaded</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-semibold"
                  data-testid="submit-edit-case"
                >
                  Update Case
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCase(null);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  data-testid="cancel-edit-case"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
