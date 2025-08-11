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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { bookingsApi, workspacesApi, usersApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useAuth, isAdmin } from "@/lib/auth"

interface Booking {
  id: number
  workspace_id: number
  user_id: number
  start_time: string
  end_time: string
  deposit: number
  total_price: number
  status: string
  created_at: string
  workspace: {
    name: string
    location: string
  }
  user: {
    name: string
    email: string
  }
}

interface Workspace {
  id: number
  name: string
  location: string
  capacity: number
}

interface User {
  id: number
  name: string
  email: string
}

interface BookingFormData {
  workspace_id: number
  user_id: number
  start_time: string
  end_time: string
  deposit: number
  total_price: number
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

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [formData, setFormData] = useState<BookingFormData>({
    workspace_id: 0,
    user_id: 0,
    start_time: "",
    end_time: "",
    deposit: 0,
    total_price: 0,
  })
  const [formLoading, setFormLoading] = useState(false)
  const [availabilityChecking, setAvailabilityChecking] = useState(false)
  const [availabilityResult, setAvailabilityResult] = useState<{ available: boolean; message?: string } | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchBookings = async (page = 1, query = "", status = "") => {
    try {
      setLoading(true)
      const params: any = {
        page,
        per_page: 10,
      }

      if (!isAdmin(user)) {
        params.user_id = user?.id
      }

      if (query) params.q = query
      if (status) params.status = status

      const response = await bookingsApi.getBookings(params)
      const data = response.data.data || response.data
      setBookings(data.bookings || data)
      setTotalPages(data.total_pages || 1)
    } catch (error) {
      console.error("Failed to fetch bookings:", error)
      toast({
        title: "Error",
        description: "Failed to fetch bookings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkspaces = async () => {
    try {
      const response = await workspacesApi.getWorkspaces()
      const data = response.data.data || response.data
      setWorkspaces(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch workspaces:", error)
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

  useEffect(() => {
    fetchBookings(currentPage, searchQuery, statusFilter)
    fetchWorkspaces()
    if (isAdmin(user)) {
      fetchUsers()
    }
  }, [currentPage, user])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchBookings(1, searchQuery, statusFilter)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
    fetchBookings(1, searchQuery, status)
  }

  const checkAvailability = async () => {
    if (!formData.workspace_id || !formData.start_time || !formData.end_time) {
      toast({
        title: "Error",
        description: "Please select workspace and time slots first.",
        variant: "destructive",
      })
      return
    }

    try {
      setAvailabilityChecking(true)
      const response = await bookingsApi.checkAvailability({
        workspace_id: formData.workspace_id,
        start_time: formData.start_time,
        end_time: formData.end_time,
      })

      const result = response.data.data || response.data
      setAvailabilityResult({
        available: result.available,
        message: result.message,
      })

      if (result.available) {
        toast({
          title: "Available",
          description: "The workspace is available for the selected time slot.",
        })
      } else {
        toast({
          title: "Not Available",
          description: result.message || "The workspace is not available for the selected time slot.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Failed to check availability:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to check availability. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAvailabilityChecking(false)
    }
  }

  const handleCreateBooking = async () => {
    try {
      setFormLoading(true)
      const bookingData = {
        ...formData,
        user_id: isAdmin(user) ? formData.user_id : user?.id || 0,
      }
      await bookingsApi.createBooking(bookingData)
      toast({
        title: "Success",
        description: "Booking created successfully.",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchBookings(currentPage, searchQuery, statusFilter)
    } catch (error: any) {
      console.error("Failed to create booking:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditBooking = async () => {
    if (!selectedBooking) return

    try {
      setFormLoading(true)
      await bookingsApi.updateBooking(selectedBooking.id, formData)
      toast({
        title: "Success",
        description: "Booking updated successfully.",
      })
      setIsEditDialogOpen(false)
      resetForm()
      fetchBookings(currentPage, searchQuery, statusFilter)
    } catch (error: any) {
      console.error("Failed to update booking:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateStatus = async (booking_id: number, status: "pending" | "confirmed" | "cancelled") => {
    try {
      await bookingsApi.updateBookingStatus(booking_id, { status })
      toast({
        title: "Success",
        description: `Booking ${status} successfully.`,
      })
      fetchBookings(currentPage, searchQuery, statusFilter)
    } catch (error: any) {
      console.error("Failed to update booking status:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update booking status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBooking = async (booking_id: number) => {
    try {
      await bookingsApi.deleteBooking(booking_id)
      toast({
        title: "Success",
        description: "Booking deleted successfully.",
      })
      fetchBookings(currentPage, searchQuery, statusFilter)
    } catch (error: any) {
      console.error("Failed to delete booking:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete booking. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      workspace_id: 0,
      user_id: 0,
      start_time: "",
      end_time: "",
      deposit: 0,
      total_price: 0,
    })
    setSelectedBooking(null)
    setAvailabilityResult(null)
  }

  const openEditDialog = (booking: Booking) => {
    setSelectedBooking(booking)
    setFormData({
      workspace_id: booking.workspace_id,
      user_id: booking.user_id,
      start_time: booking.start_time.slice(0, 16),
      end_time: booking.end_time.slice(0, 16),
      deposit: booking.deposit,
      total_price: booking.total_price,
    })
    setIsEditDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />
      case "pending":
        return <AlertCircle className="w-4 h-4" />
      case "cancelled":
        return <XCircle className="w-4 h-4" />
      default:
        return null
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
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Bookings</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage workspace bookings and availability</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Booking</DialogTitle>
                <DialogDescription>Book a workspace with availability checking.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="create_workspace">Workspace</Label>
                  <Select
                    value={formData.workspace_id.toString()}
                    onValueChange={(value) => setFormData({ ...formData, workspace_id: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select workspace" />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaces.map((workspace) => (
                        <SelectItem key={workspace.id} value={workspace.id.toString()}>
                          {workspace.name} - {workspace.location} (Capacity: {workspace.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isAdmin(user) && (
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
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create_start_time">Start Time</Label>
                    <Input
                      id="create_start_time"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="create_end_time">End Time</Label>
                    <Input
                      id="create_end_time"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={checkAvailability}
                    disabled={availabilityChecking}
                    className="flex-1 bg-transparent"
                  >
                    {availabilityChecking ? "Checking..." : "Check Availability"}
                  </Button>
                  {availabilityResult && (
                    <div
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        availabilityResult.available
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {availabilityResult.available ? "Available" : "Not Available"}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create_deposit">Deposit (EGP)</Label>
                    <Input
                      id="create_deposit"
                      type="number"
                      step="0.01"
                      value={formData.deposit}
                      onChange={(e) => setFormData({ ...formData, deposit: Number.parseFloat(e.target.value) })}
                      placeholder="Enter deposit amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create_total_price">Total Price (EGP)</Label>
                    <Input
                      id="create_total_price"
                      type="number"
                      step="0.01"
                      value={formData.total_price}
                      onChange={(e) => setFormData({ ...formData, total_price: Number.parseFloat(e.target.value) })}
                      placeholder="Enter total price"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateBooking}
                  disabled={formLoading || (availabilityResult && !availabilityResult.available)}
                >
                  {formLoading ? "Creating..." : "Create Booking"}
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
                    placeholder="Search bookings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} variant="outline">
                Search
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bookings Table */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Bookings ({bookings.length})</span>
            </CardTitle>
            <CardDescription>Manage workspace bookings and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">Loading bookings...</div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">No bookings found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Workspace</TableHead>
                      <TableHead>Time Slot</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <motion.tr key={booking.id} variants={itemVariants}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700 dark:text-blue-200">
                                {booking.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div>{booking.user.name}</div>
                              <div className="text-sm text-slate-500">{booking.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{booking.workspace.name}</div>
                            <div className="text-sm text-slate-500">{booking.workspace.location}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="text-sm">
                                {new Date(booking.start_time).toLocaleDateString()}{" "}
                                {new Date(booking.start_time).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="text-sm text-slate-500">
                                to{" "}
                                {new Date(booking.end_time).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="font-medium">EGP {booking.total_price.toFixed(2)}</div>
                              <div className="text-sm text-slate-500">Deposit: EGP {booking.deposit.toFixed(2)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.status)} variant="secondary">
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(booking.status)}
                              <span>{booking.status}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {isAdmin(user) && booking.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(booking)}>
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
                                  <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this booking? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteBooking(booking.id)}
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

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
            <DialogDescription>Update booking information and pricing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_start_time">Start Time</Label>
                <Input
                  id="edit_start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_end_time">End Time</Label>
                <Input
                  id="edit_end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_deposit">Deposit (EGP)</Label>
                <Input
                  id="edit_deposit"
                  type="number"
                  step="0.01"
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: Number.parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="edit_total_price">Total Price (EGP)</Label>
                <Input
                  id="edit_total_price"
                  type="number"
                  step="0.01"
                  value={formData.total_price}
                  onChange={(e) => setFormData({ ...formData, total_price: Number.parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditBooking} disabled={formLoading}>
              {formLoading ? "Updating..." : "Update Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
