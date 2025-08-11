"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, Search, Trash2, DollarSign, Calendar, FileText, TrendingDown } from "lucide-react"
import { expensesApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Expense {
  id: number
  name: string
  amount: number
  description: string
  created_at: string
}

interface ExpenseFormData {
  name: string
  amount: number
  description: string
}

interface ExpenseReport {
  total_expenses: number
  expense_count: number
  average_expense: number
  expenses_by_category?: Array<{
    category: string
    total_amount: number
    count: number
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

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [formData, setFormData] = useState<ExpenseFormData>({
    name: "",
    amount: 0,
    description: "",
  })
  const [reportData, setReportData] = useState<ExpenseReport | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const { toast } = useToast()

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const response = await expensesApi.getExpenses()
      const data = response.data.data || response.data
      setExpenses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch expenses:", error)
      toast({
        title: "Error",
        description: "Failed to fetch expenses. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchExpenseReport = async () => {
    try {
      setReportLoading(true)
      const response = await expensesApi.getExpenseReport()
      const data = response.data.data || response.data
      setReportData(data)
    } catch (error) {
      console.error("Failed to fetch expense report:", error)
      toast({
        title: "Error",
        description: "Failed to fetch expense report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setReportLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  const handleCreateExpense = async () => {
    try {
      setFormLoading(true)
      await expensesApi.createExpense(formData)
      toast({
        title: "Success",
        description: "Expense created successfully.",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchExpenses()
    } catch (error: any) {
      console.error("Failed to create expense:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create expense. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteExpense = async (expense_id: number) => {
    try {
      await expensesApi.deleteExpense(expense_id)
      toast({
        title: "Success",
        description: "Expense deleted successfully.",
      })
      fetchExpenses()
    } catch (error: any) {
      console.error("Failed to delete expense:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete expense. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      amount: 0,
      description: "",
    })
  }

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

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
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Expenses</h1>
            <p className="text-slate-600 dark:text-slate-400">Track and manage business expenses</p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={fetchExpenseReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Expense Report</DialogTitle>
                  <DialogDescription>Summary of all business expenses</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Button onClick={fetchExpenseReport} disabled={reportLoading} className="w-full">
                    {reportLoading ? "Generating..." : "Generate Report"}
                  </Button>

                  {reportData && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-red-600">
                              EGP {reportData.total_expenses.toFixed(2)}
                            </div>
                            <div className="text-sm text-slate-500">Total Expenses</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-slate-800 dark:text-white">
                              {reportData.expense_count}
                            </div>
                            <div className="text-sm text-slate-500">Total Count</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-blue-600">
                              EGP {reportData.average_expense.toFixed(2)}
                            </div>
                            <div className="text-sm text-slate-500">Average Expense</div>
                          </CardContent>
                        </Card>
                      </div>
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
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Expense</DialogTitle>
                  <DialogDescription>Record a new business expense.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="create_name">Expense Name</Label>
                    <Input
                      id="create_name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter expense name"
                    />
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
                      placeholder="Enter expense description"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateExpense} disabled={formLoading}>
                    {formLoading ? "Creating..." : "Create Expense"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search expenses by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">EGP {totalExpenses.toFixed(2)}</div>
              <div className="text-sm text-slate-500">Total Filtered</div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Expenses Table */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5" />
              <span>Expenses ({filteredExpenses.length})</span>
            </CardTitle>
            <CardDescription>Track all business expenses and costs</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">Loading expenses...</div>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">No expenses found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <motion.tr key={expense.id} variants={itemVariants}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                              <TrendingDown className="w-4 h-4 text-red-700 dark:text-red-200" />
                            </div>
                            <span>{expense.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 font-medium text-red-600">
                            <DollarSign className="w-4 h-4" />
                            <span>EGP {expense.amount.toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={expense.description}>
                            {expense.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{new Date(expense.created_at).toLocaleDateString()}</span>
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
                                <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {expense.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteExpense(expense.id)}
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
