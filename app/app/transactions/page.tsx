"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Trash2, Receipt, DollarSign, TrendingUp, TrendingDown, Calendar, FileText } from "lucide-react"
import { transactionsApi, usersApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
  id: number
  user_id: number
  type: string
  amount: number
  description: string
  created_at: string
  user: {
    name: string
    email: string
  }
}

interface User {
  id: number
  name: string
  email: string
}

interface TransactionFormData {
  user_id: number
  type: "payment" | "withdrawal"
  amount: number
  description: string
}

interface TransactionReport {
  total_payments: number
  total_withdrawals: number
  net_amount: number
  transactions_by_day?: Array<{
    date: string
    total_amount: number
    transaction_count: number
  }>
  transactions_by_month?: Array<{
    month: string
    total_amount: number
    transaction_count: number
  }>
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [formData, setFormData] = useState<TransactionFormData>({
    user_id: 0,
    type: "payment",
    amount: 0,
    description: "",
  })
  const [reportData, setReportData] = useState<TransactionReport | null>(null)
  const [reportParams, setReportParams] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
    group_by: "day" as "day" | "month",
  })
  const [formLoading, setFormLoading] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const { toast } = useToast()

  const fetchTransactions = async (page = 1, query = "", type = "") => {
    try {
      setLoading(true)
      const params: any = {
        page,
        per_page: 10,
      }

      if (query) params.q = query
      if (type) params.type = type

      const response = await transactionsApi.getTransactions(params)
      const data = response.data.data || response.data
      setTransactions(data.transactions || data)
      setTotalPages(data.total_pages || 1)
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch transactions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getUsers({ per_page: 100 })
      const data = response.data.data || response.data
      setUsers(data.users || data)
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const fetchTransactionReport = async () => {
    try {
      setReportLoading(true)
      const response = await transactionsApi.getTransactionReport(reportParams)
      const data = response.data.data || response.data
      setReportData(data)
    } catch (error) {
      console.error("Failed to fetch transaction report:", error)
      toast({
        title: "Error",
        description: "Failed to fetch transaction report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setReportLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions(currentPage, searchQuery, typeFilter)
    fetchUsers()
  }, [currentPage])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchTransactions(1, searchQuery, typeFilter)
  }

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type)
    setCurrentPage(1)
    fetchTransactions(1, searchQuery, type)
  }

  const handleCreateTransaction = async () => {
    try {
      setFormLoading(true)
      await transactionsApi.createTransaction(formData)
      toast({
        title: "Success",
        description: "Transaction created successfully.",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchTransactions(currentPage, searchQuery, typeFilter)
    } catch (error: any) {
      console.error("Failed to create transaction:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create transaction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteTransaction = async (transaction_id: number) => {
    try {
      await transactionsApi.deleteTransaction(transaction_id)
      toast({
        title: "Success",
        description: "Transaction deleted successfully.",
      })
      fetchTransactions(currentPage, searchQuery, typeFilter)
    } catch (error: any) {
      console.error("Failed to delete transaction:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete transaction. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      user_id: 0,
      type: "payment",
      amount: 0,
      description: "",
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "payment":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "withdrawal":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <TrendingUp className="w-4 h-4" />
      case "withdrawal":
        return <TrendingDown className="w-4 h-4" />
      default:
        return <DollarSign className="w-4 h-4" />
    }
  }

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Transactions</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage payments, withdrawals, and financial records</p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={fetchTransactionReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Transaction Report</DialogTitle>
                  <DialogDescription>Financial summary and transaction analytics</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="report_from">From Date</Label>
                      <Input
                        id="report_from"
                        type="date"
                        value={reportParams.from}
                        onChange={(e) => setReportParams({ ...reportParams, from: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="report_to">To Date</Label>
                      <Input
                        id="report_to"
                        type="date"
                        value={reportParams.to}
                        onChange={(e) => setReportParams({ ...reportParams, to: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="report_group">Group By</Label>
                    <Select
                      value={reportParams.group_by}
                      onValueChange={(value: "day" | "month") => setReportParams({ ...reportParams, group_by: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grouping" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Daily</SelectItem>
                        <SelectItem value="month">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={fetchTransactionReport} disabled={reportLoading} className="w-full">
                    {reportLoading ? "Generating..." : "Generate Report"}
                  </Button>

                  {reportData && (
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-green-600">
                              EGP {reportData.total_payments.toFixed(2)}
                            </div>
                            <div className="text-sm text-slate-500">Total Payments</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-red-600">
                              EGP {reportData.total_withdrawals.toFixed(2)}
                            </div>
                            <div className="text-sm text-slate-500">Total Withdrawals</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div
                              className={`text-2xl font-bold ${reportData.net_amount >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              EGP {reportData.net_amount.toFixed(2)}
                            </div>
                            <div className="text-sm text-slate-500">Net Amount</div>
                          </CardContent>
                        </Card>
                      </div>

                      {(reportData.transactions_by_day || reportData.transactions_by_month) && (
                        <div className="max-h-60 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{reportParams.group_by === "day" ? "Date" : "Month"}</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Count</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(reportData.transactions_by_day || reportData.transactions_by_month || []).map(
                                (item, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{"date" in item ? item.date : item.month}</TableCell>
                                    <TableCell>EGP {item.total_amount.toFixed(2)}</TableCell>
                                    <TableCell>{item.transaction_count}</TableCell>
                                  </TableRow>
                                ),
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Transaction</DialogTitle>
                  <DialogDescription>Record a new payment or withdrawal transaction.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="create_user">User</Label>
                    <Select
                      value={formData.user_id.toString()}
                      onValueChange={(value) => setFormData({ ...formData, user_id: Number.parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="create_type">Transaction Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "payment" | "withdrawal") => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="payment">Payment (Income)</SelectItem>
                        <SelectItem value="withdrawal">Withdrawal (Expense)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="create_amount">Amount (EGP)</Label>
                    <Input
                      id="create_amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: Number.parseFloat(e.target.value) })}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create_description">Description</Label>
                    <Textarea
                      id="create_description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter transaction description"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTransaction} disabled={formLoading}>
                    {formLoading ? "Creating..." : "Create Transaction"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={handleTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} variant="outline">
                Search
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions Table */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="w-5 h-5" />
              <span>Transactions ({transactions.length})</span>
            </CardTitle>
            <CardDescription>Track all financial transactions and payments</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">Loading transactions...</div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">No transactions found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <motion.tr key={transaction.id} variants={itemVariants}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700 dark:text-blue-200">
                                {transaction.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div>{transaction.user.name}</div>
                              <div className="text-sm text-slate-500">{transaction.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(transaction.type)} variant="secondary">
                            <div className="flex items-center space-x-1">
                              {getTypeIcon(transaction.type)}
                              <span className="capitalize">{transaction.type}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div
                            className={`flex items-center space-x-1 font-medium ${
                              transaction.type === "payment" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            <DollarSign className="w-4 h-4" />
                            <span>
                              {transaction.type === "payment" ? "+" : "-"}EGP {transaction.amount.toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={transaction.description}>
                            {transaction.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this transaction? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTransaction(transaction.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
