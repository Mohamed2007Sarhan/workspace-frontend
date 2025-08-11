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
import { Plus, Search, Edit, Trash2, UserCheck, Calendar, CreditCard, RefreshCw } from "lucide-react"
import { subscribersApi, usersApi, plansApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Subscriber {
  id: number
  user_id: number
  plan_id: number
  start_date: string
  end_date: string
  status: string
  user: {
    name: string
    email: string
  }
  plan: {
    name: string
    price: number
  }
}

interface User {
  id: number
  name: string
  email: string
}

interface Plan {
  id: number
  name: string
  duration_days: number
  price: number
}

interface SubscriberFormData {
  user_id: number
  plan_id: number
  start_date: string
  end_date: string
  status: string
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

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isChangePlanDialogOpen, setIsChangePlanDialogOpen] = useState(false)
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null)
  const [formData, setFormData] = useState<SubscriberFormData>({
    user_id: 0,
    plan_id: 0,
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    status: "active",
  })
  const [formLoading, setFormLoading] = useState(false)
  const { toast } = useToast()

  const fetchSubscribers = async (page = 1, query = "") => {
    try {
      setLoading(true)
      const response = await subscribersApi.getSubscribers({
        page,
        per_page: 10,
        q: query || undefined,
      })
      const data = response.data.data || response.data
      setSubscribers(data.subscribers || data)
      setTotalPages(data.total_pages || 1)
    } catch (error) {
      console.error("Failed to fetch subscribers:", error)
      toast({
        title: "Error",
        description: "Failed to fetch subscribers. Please try again.",
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

  const fetchPlans = async () => {
    try {
      const response = await plansApi.getPlans()
      const data = response.data.data || response.data
      setPlans(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch plans:", error)
    }
  }

  useEffect(() => {
    fetchSubscribers(currentPage, searchQuery)
    fetchUsers()
    fetchPlans()
  }, [currentPage])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchSubscribers(1, searchQuery)
  }

  const calculateEndDate = (startDate: string, planId: number) => {
    const plan = plans.find((p) => p.id === planId)
    if (!plan) return ""

    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(start.getDate() + plan.duration_days)
    return end.toISOString().split("T")[0]
  }

  const handleCreateSubscriber = async () => {
    try {
      setFormLoading(true)
      const endDate = calculateEndDate(formData.start_date, formData.plan_id)
      await subscribersApi.createSubscriber({
        ...formData,
        end_date: endDate,
      })
      toast({
        title: "Success",
        description: "Subscriber created successfully.",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchSubscribers(currentPage, searchQuery)
    } catch (error: any) {
      console.error("Failed to create subscriber:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create subscriber. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditSubscriber = async () => {
    if (!selectedSubscriber) return

    try {
      setFormLoading(true)
      await subscribersApi.updateSubscriber(selectedSubscriber.id, formData)
      toast({
        title: "Success",
        description: "Subscriber updated successfully.",
      })
      setIsEditDialogOpen(false)
      resetForm()
      fetchSubscribers(currentPage, searchQuery)
    } catch (error: any) {
      console.error("Failed to update subscriber:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update subscriber. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleChangePlan = async () => {
    if (!selectedSubscriber) return

    try {
      setFormLoading(true)
      const endDate = calculateEndDate(formData.start_date, formData.plan_id)
      await subscribersApi.changePlan(selectedSubscriber.id, {
        plan_id: formData.plan_id,
        start_date: formData.start_date,
        end_date: endDate,
      })
      toast({
        title: "Success",
        description: "Plan changed successfully.",
      })
      setIsChangePlanDialogOpen(false)
      resetForm()
      fetchSubscribers(currentPage, searchQuery)
    } catch (error: any) {
      console.error("Failed to change plan:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to change plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteSubscriber = async (subscriber_id: number) => {
    try {
      await subscribersApi.deleteSubscriber(subscriber_id)
      toast({
        title: "Success",
        description: "Subscriber deleted successfully.",
      })
      fetchSubscribers(currentPage, searchQuery)
    } catch (error: any) {
      console.error("Failed to delete subscriber:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete subscriber. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      user_id: 0,
      plan_id: 0,
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      status: "active",
    })
    setSelectedSubscriber(null)
  }

  const openEditDialog = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber)
    setFormData({
      user_id: subscriber.user_id,
      plan_id: subscriber.plan_id,
      start_date: subscriber.start_date.split("T")[0],
      end_date: subscriber.end_date.split("T")[0],
      status: subscriber.status,
    })
    setIsEditDialogOpen(true)
  }

  const openChangePlanDialog = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber)
    setFormData({
      user_id: subscriber.user_id,
      plan_id: subscriber.plan_id,
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      status: subscriber.status,
    })
    setIsChangePlanDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "suspended":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date()
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
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Subscribers</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage user subscriptions and plans</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Subscriber
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Subscriber</DialogTitle>
                <DialogDescription>Add a new subscription for a user.</DialogDescription>
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
                  <Label htmlFor="create_plan">Plan</Label>
                  <Select
                    value={formData.plan_id.toString()}
                    onValueChange={(value) => setFormData({ ...formData, plan_id: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name} - EGP {plan.price} ({plan.duration_days} days)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="create_start_date">Start Date</Label>
                  <Input
                    id="create_start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="create_status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSubscriber} disabled={formLoading}>
                  {formLoading ? "Creating..." : "Create Subscriber"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search subscribers by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={handleSearch} variant="outline">
                Search
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Subscribers Table */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5" />
              <span>Subscribers ({subscribers.length})</span>
            </CardTitle>
            <CardDescription>Manage user subscriptions and plan changes</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">Loading subscribers...</div>
              </div>
            ) : subscribers.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">No subscribers found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map((subscriber) => (
                      <motion.tr key={subscriber.id} variants={itemVariants}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700 dark:text-blue-200">
                                {subscriber.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div>{subscriber.user.name}</div>
                              <div className="text-sm text-slate-500">{subscriber.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <CreditCard className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="font-medium">{subscriber.plan.name}</div>
                              <div className="text-sm text-slate-500">EGP {subscriber.plan.price}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{new Date(subscriber.start_date).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className={isExpired(subscriber.end_date) ? "text-red-600 font-medium" : ""}>
                              {new Date(subscriber.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(subscriber.status)} variant="secondary">
                            {subscriber.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => openChangePlanDialog(subscriber)}>
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(subscriber)}>
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
                                  <AlertDialogTitle>Delete Subscriber</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this subscription for {subscriber.user.name}? This
                                    action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSubscriber(subscriber.id)}
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

      {/* Edit Subscriber Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subscriber</DialogTitle>
            <DialogDescription>Update subscriber information and status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_start_date">Start Date</Label>
              <Input
                id="edit_start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_end_date">End Date</Label>
              <Input
                id="edit_end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubscriber} disabled={formLoading}>
              {formLoading ? "Updating..." : "Update Subscriber"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={isChangePlanDialogOpen} onOpenChange={setIsChangePlanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
            <DialogDescription>Change the subscription plan for this user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="change_plan">New Plan</Label>
              <Select
                value={formData.plan_id.toString()}
                onValueChange={(value) => setFormData({ ...formData, plan_id: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.name} - EGP {plan.price} ({plan.duration_days} days)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="change_start_date">Start Date</Label>
              <Input
                id="change_start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangePlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePlan} disabled={formLoading}>
              {formLoading ? "Changing..." : "Change Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
