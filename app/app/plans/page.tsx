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
import { Plus, Edit, Trash2, CreditCard, Calendar, DollarSign } from "lucide-react"
import { plansApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Plan {
  id: number
  name: string
  duration_days: number
  price: number
  created_at: string
}

interface PlanFormData {
  name: string
  duration_days: number
  price: number
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

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [formData, setFormData] = useState<PlanFormData>({
    name: "",
    duration_days: 30,
    price: 0,
  })
  const [formLoading, setFormLoading] = useState(false)
  const { toast } = useToast()

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await plansApi.getPlans()
      const data = response.data.data || response.data
      setPlans(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch plans:", error)
      toast({
        title: "Error",
        description: "Failed to fetch plans. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleCreatePlan = async () => {
    try {
      setFormLoading(true)
      await plansApi.createPlan(formData)
      toast({
        title: "Success",
        description: "Plan created successfully.",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchPlans()
    } catch (error: any) {
      console.error("Failed to create plan:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditPlan = async () => {
    if (!selectedPlan) return

    try {
      setFormLoading(true)
      await plansApi.updatePlan(selectedPlan.id, formData)
      toast({
        title: "Success",
        description: "Plan updated successfully.",
      })
      setIsEditDialogOpen(false)
      resetForm()
      fetchPlans()
    } catch (error: any) {
      console.error("Failed to update plan:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeletePlan = async (plan_id: number) => {
    try {
      await plansApi.deletePlan(plan_id)
      toast({
        title: "Success",
        description: "Plan deleted successfully.",
      })
      fetchPlans()
    } catch (error: any) {
      console.error("Failed to delete plan:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete plan. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      duration_days: 30,
      price: 0,
    })
    setSelectedPlan(null)
  }

  const openEditDialog = (plan: Plan) => {
    setSelectedPlan(plan)
    setFormData({
      name: plan.name,
      duration_days: plan.duration_days,
      price: plan.price,
    })
    setIsEditDialogOpen(true)
  }

  const formatDuration = (days: number) => {
    if (days === 1) return "1 Day"
    if (days === 7) return "1 Week"
    if (days === 30) return "1 Month"
    if (days === 90) return "3 Months"
    if (days === 365) return "1 Year"
    return `${days} Days`
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
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Subscription Plans</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage subscription plans and pricing</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Plan</DialogTitle>
                <DialogDescription>Add a new subscription plan with pricing and duration.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="create_name">Plan Name</Label>
                  <Input
                    id="create_name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter plan name"
                  />
                </div>
                <div>
                  <Label htmlFor="create_duration">Duration (Days)</Label>
                  <Input
                    id="create_duration"
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: Number.parseInt(e.target.value) })}
                    placeholder="Enter duration in days"
                  />
                </div>
                <div>
                  <Label htmlFor="create_price">Price (EGP)</Label>
                  <Input
                    id="create_price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                    placeholder="Enter price"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePlan} disabled={formLoading}>
                  {formLoading ? "Creating..." : "Create Plan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Plans Table */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Plans ({plans.length})</span>
            </CardTitle>
            <CardDescription>Manage subscription plans and pricing options</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">Loading plans...</div>
              </div>
            ) : plans.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">No plans found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan Name</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <motion.tr key={plan.id} variants={itemVariants}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <CreditCard className="w-4 h-4 text-blue-700 dark:text-blue-200" />
                            </div>
                            <span>{plan.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{formatDuration(plan.duration_days)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">EGP {plan.price.toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span>{new Date(plan.created_at).toLocaleDateString()}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(plan)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {plan.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeletePlan(plan.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>Update plan information and pricing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Plan Name</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter plan name"
              />
            </div>
            <div>
              <Label htmlFor="edit_duration">Duration (Days)</Label>
              <Input
                id="edit_duration"
                type="number"
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: Number.parseInt(e.target.value) })}
                placeholder="Enter duration in days"
              />
            </div>
            <div>
              <Label htmlFor="edit_price">Price (EGP)</Label>
              <Input
                id="edit_price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                placeholder="Enter price"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPlan} disabled={formLoading}>
              {formLoading ? "Updating..." : "Update Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
