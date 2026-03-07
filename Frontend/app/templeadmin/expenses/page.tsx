"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Calendar, Filter, Plus, Download, X } from "lucide-react"
import AuthWrapper from "@/app/components/AuthWrapper"

const initialExpenses = [
  {
    id: "EXP-001",
    category: "Infrastructure",
    amount: "₹1,50,000",
    date: "17/5/2023",
    description: "Temple renovation work",
    hash: "0x8f7d...3b2a",
  },
  {
    id: "EXP-002",
    category: "Food & Prasad",
    amount: "₹25,000",
    date: "16/5/2023",
    description: "Daily prasad ingredients",
    hash: "0x2a1b...9c4d",
  },
  {
    id: "EXP-003",
    category: "Salaries",
    amount: "₹75,000",
    date: "15/5/2023",
    description: "Staff monthly salaries",
    hash: "0x7e3f...5d2c",
  },
  {
    id: "EXP-004",
    category: "Events",
    amount: "₹50,000",
    date: "14/5/2023",
    description: "Ram Navami celebration",
    hash: "0x4b2c...8e1a",
  },
  {
    id: "EXP-005",
    category: "Utilities",
    amount: "₹15,000",
    date: "13/5/2023",
    description: "Electricity and water bills",
    hash: "0x9d4e...2f7b",
  },
]

export default function Expenses() {
  const [expenses, setExpenses] = useState(initialExpenses)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newExpense, setNewExpense] = useState({
    category: "",
    amount: "",
    description: "",
    date: "",
  })

  const handleAddExpense = () => {
    if (newExpense.category && newExpense.amount && newExpense.description && newExpense.date) {
      const expense = {
        id: `EXP-${String(expenses.length + 1).padStart(3, "0")}`,
        category: newExpense.category,
        amount: `₹${newExpense.amount}`,
        date: newExpense.date,
        description: newExpense.description,
        hash: `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 4)}`,
      }
      setExpenses([expense, ...expenses])
      setNewExpense({ category: "", amount: "", description: "", date: "" })
      setShowAddForm(false)
    }
  }

  return (
    <AuthWrapper role="templeAdmin">
      <div className="p-8 space-y-6 h-full overflow-y-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Expenses</h1>
          </div>
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Expense</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium shadow-sm flex items-center space-x-2 hover:bg-gray-50"
            >
              <Download className="w-5 h-5" />
              <span>Export CSV</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Add Expense Modal */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Add New Expense</h2>
                  <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Category</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Food & Prasad">Food & Prasad</option>
                      <option value="Salaries">Salaries</option>
                      <option value="Events">Events</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                    <input
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      placeholder="Enter amount"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      placeholder="Enter description"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddExpense}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-medium"
                    >
                      Add Expense
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expense Manager Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-2">Expense Manager</h2>
          <p className="text-gray-600 mb-6">Track and manage all expenses incurred by the temple</p>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search expenses..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">Pick a date</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">Filter</span>
            </motion.button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-medium text-gray-600">ID</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Category</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Description</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Blockchain Hash</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, index) => (
                  <motion.tr
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4 text-gray-800">{expense.id}</td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-800 font-bold">{expense.amount}</td>
                    <td className="py-4 px-4 text-gray-600">{expense.date}</td>
                    <td className="py-4 px-4 text-gray-800">{expense.description}</td>
                    <td className="py-4 px-4 text-gray-600 font-mono text-sm">{expense.hash}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center space-x-2 mt-6">
            <button className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors">Previous</button>
            <button className="px-3 py-2 bg-orange-500 text-white rounded-lg">1</button>
            <button className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors">...</button>
            <button className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors">10</button>
            <button className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors">Next</button>
          </div>
        </motion.div>
      </div>
    </AuthWrapper>
  )
}
