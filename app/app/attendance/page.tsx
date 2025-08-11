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
import { Label } from "@/components/ui/label"
import { Clock, Search, LogIn, LogOut, Calendar, Users, FileText, Timer } from "lucide-react"
import { attendanceApi, usersApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface AttendanceRecord {
  id: number
  employee_id: number
  check_in: string
  check_out?: string
  date: string
  hours_worked?: number
  employee: {
    name: string
    email: string
  }
}

interface User {
  id: number
  name: string
  email: string
  role: string
}

interface CheckInFormData {
  employee_id: number
  check_in: string
}

interface CheckOutFormData {
  employee_id: number
  check_out: string
}

interface AttendanceReport {
  total_employees: number
  present_today: number
  total_hours_today: number
  average_hours: number
  attendance_by_employee?: Array<{
    employee_name: string
    total_hours: number
    days_present: number
    attendance_rate: number
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

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState({
    from: new Date().toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  })
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false)
  const [isCheckOutDialogOpen, setIsCheckOutDialogOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [checkInFormData, setCheckInFormData] = useState<CheckInFormData>({
    employee_id: 0,
    check_in: new Date().toISOString().slice(0, 16),
  })
  const [checkOutFormData, setCheckOutFormData] = useState<CheckOutFormData>({
    employee_id: 0,
    check_out: new Date().toISOString().slice(0, 16),
  })
  const [reportData, setReportData] = useState<AttendanceReport | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const { toast } = useToast()

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (dateFilter.from) params.from = dateFilter.from
      if (dateFilter.to) params.to = dateFilter.to

      const response = await attendanceApi.getAttendance(params)
      const data = response.data.data || response.data
      setAttendanceRecords(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch attendance records:", error)
      toast({
        title: "Error",
        description: "Failed to fetch attendance records. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await usersApi.getUsers({ per_page: 100 })
      const data = response.data.data || response.data
      const allUsers = data.users || data
      // Filter for employees only
      setEmployees(allUsers.filter((user: User) => user.role === "employee"))
    } catch (error) {
      console.error("Failed to fetch employees:", error)
    }
  }

  const fetchAttendanceReport = async () => {
    try {
      setReportLoading(true)
      const response = await attendanceApi.getAttendanceReport()
      const data = response.data.data || response.data
      setReportData(data)
    } catch (error) {
      console.error("Failed to fetch attendance report:", error)
      toast({
        title: "Error",
        description: "Failed to fetch attendance report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setReportLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendanceRecords()
    fetchEmployees()
  }, [])

  const handleDateFilterChange = () => {
    fetchAttendanceRecords()
  }

  const handleCheckIn = async () => {
    try {
      setFormLoading(true)
      await attendanceApi.checkIn(checkInFormData)
      toast({
        title: "Success",
        description: "Employee checked in successfully.",
      })
      setIsCheckInDialogOpen(false)
      resetCheckInForm()
      fetchAttendanceRecords()
    } catch (error: any) {
      console.error("Failed to check in:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to check in. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleCheckOut = async () => {
    try {
      setFormLoading(true)
      await attendanceApi.checkOut(checkOutFormData)
      toast({
        title: "Success",
        description: "Employee checked out successfully.",
      })
      setIsCheckOutDialogOpen(false)
      resetCheckOutForm()
      fetchAttendanceRecords()
    } catch (error: any) {
      console.error("Failed to check out:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to check out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const resetCheckInForm = () => {
    setCheckInFormData({
      employee_id: 0,
      check_in: new Date().toISOString().slice(0, 16),
    })
  }

  const resetCheckOutForm = () => {
    setCheckOutFormData({
      employee_id: 0,
      check_out: new Date().toISOString().slice(0, 16),
    })
  }

  const getAttendanceStatus = (record: AttendanceRecord) => {
    if (record.check_out) {
      return { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Complete" }
    }
    return { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", label: "In Progress" }
  }

  const calculateHoursWorked = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return "In Progress"
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return `${hours.toFixed(1)} hours`
  }

  const filteredRecords = attendanceRecords.filter(
    (record) =>
      record.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employee.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const todayRecords = filteredRecords.filter((record) => record.date === new Date().toISOString().split("T")[0])

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
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Attendance Management</h1>
            <p className="text-slate-600 dark:text-slate-400">Track employee attendance and working hours</p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={fetchAttendanceReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Attendance Report</DialogTitle>
                  <DialogDescription>Employee attendance summary and analytics</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Button onClick={fetchAttendanceReport} disabled={reportLoading} className="w-full">
                    {reportLoading ? "Generating..." : "Generate Report"}
                  </Button>

                  {reportData && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-blue-600">{reportData.total_employees}</div>
                            <div className="text-sm text-slate-500">Total Employees</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-green-600">{reportData.present_today}</div>
                            <div className="text-sm text-slate-500">Present Today</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-purple-600">
                              {reportData.total_hours_today.toFixed(1)}h
                            </div>
                            <div className="text-sm text-slate-500">Total Hours Today</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-orange-600">
                              {reportData.average_hours.toFixed(1)}h
                            </div>
                            <div className="text-sm text-slate-500">Average Hours</div>
                          </CardContent>
                        </Card>
                      </div>

                      {reportData.attendance_by_employee && (
                        <div className="max-h-60 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Total Hours</TableHead>
                                <TableHead>Days Present</TableHead>
                                <TableHead>Attendance Rate</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {reportData.attendance_by_employee.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell>{item.employee_name}</TableCell>
                                  <TableCell>{item.total_hours.toFixed(1)}h</TableCell>
                                  <TableCell>{item.days_present}</TableCell>
                                  <TableCell>{(item.attendance_rate * 100).toFixed(1)}%</TableCell>
                                </TableRow>
                              ))}
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

            <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <LogIn className="w-4 h-4 mr-2" />
                  Check In
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Employee Check In</DialogTitle>
                  <DialogDescription>Record employee arrival time.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="checkin_employee">Employee</Label>
                    <Select
                      value={checkInFormData.employee_id.toString()}
                      onValueChange={(value) =>
                        setCheckInFormData({ ...checkInFormData, employee_id: Number.parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.name} ({employee.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="checkin_time">Check In Time</Label>
                    <Input
                      id="checkin_time"
                      type="datetime-local"
                      value={checkInFormData.check_in}
                      onChange={(e) => setCheckInFormData({ ...checkInFormData, check_in: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCheckInDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCheckIn} disabled={formLoading}>
                    {formLoading ? "Checking In..." : "Check In"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isCheckOutDialogOpen} onOpenChange={setIsCheckOutDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700">
                  <LogOut className="w-4 h-4 mr-2" />
                  Check Out
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Employee Check Out</DialogTitle>
                  <DialogDescription>Record employee departure time.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="checkout_employee">Employee</Label>
                    <Select
                      value={checkOutFormData.employee_id.toString()}
                      onValueChange={(value) =>
                        setCheckOutFormData({ ...checkOutFormData, employee_id: Number.parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.name} ({employee.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="checkout_time">Check Out Time</Label>
                    <Input
                      id="checkout_time"
                      type="datetime-local"
                      value={checkOutFormData.check_out}
                      onChange={(e) => setCheckOutFormData({ ...checkOutFormData, check_out: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCheckOutDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCheckOut} disabled={formLoading}>
                    {formLoading ? "Checking Out..." : "Check Out"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-slate-800 dark:text-white">{employees.length}</div>
              <div className="text-sm text-slate-500">Total Employees</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{todayRecords.length}</div>
              <div className="text-sm text-slate-500">Present Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{todayRecords.filter((r) => r.check_out).length}</div>
              <div className="text-sm text-slate-500">Completed Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">
                {todayRecords.filter((r) => !r.check_out).length}
              </div>
              <div className="text-sm text-slate-500">Still Working</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <div>
                  <Label htmlFor="date_from" className="text-sm">
                    From
                  </Label>
                  <Input
                    id="date_from"
                    type="date"
                    value={dateFilter.from}
                    onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
                    className="w-40"
                  />
                </div>
                <div>
                  <Label htmlFor="date_to" className="text-sm">
                    To
                  </Label>
                  <Input
                    id="date_to"
                    type="date"
                    value={dateFilter.to}
                    onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
                    className="w-40"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleDateFilterChange} variant="outline">
                    Filter
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Attendance Records Table */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Attendance Records ({filteredRecords.length})</span>
            </CardTitle>
            <CardDescription>Employee check-in and check-out records</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">Loading attendance records...</div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">No attendance records found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Hours Worked</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => {
                      const status = getAttendanceStatus(record)
                      return (
                        <motion.tr key={record.id} variants={itemVariants}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-blue-700 dark:text-blue-200" />
                              </div>
                              <div>
                                <div>{record.employee.name}</div>
                                <div className="text-sm text-slate-500">{record.employee.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span>{new Date(record.date).toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <LogIn className="w-4 h-4 text-green-600" />
                              <span>
                                {new Date(record.check_in).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {record.check_out ? (
                              <div className="flex items-center space-x-1">
                                <LogOut className="w-4 h-4 text-red-600" />
                                <span>
                                  {new Date(record.check_out).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Timer className="w-4 h-4 text-slate-400" />
                              <span>{calculateHoursWorked(record.check_in, record.check_out)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={status.color} variant="secondary">
                              {status.label}
                            </Badge>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
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
