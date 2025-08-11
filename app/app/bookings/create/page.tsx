"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, MapPin, Users, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/auth"
import { toast } from "sonner"

interface Workspace {
  id: number
  name: string
  location: string
  capacity: number
}

interface TimeSlot {
  start: string
  end: string
  available: boolean
}

export default function CreateBookingPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<{ start: string; end: string } | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [bookingData, setBookingData] = useState({
    deposit: 0,
    total_price: 0,
    notes: "",
  })

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const fetchWorkspaces = async () => {
    try {
      const response = await api.get("/workspaces")
      setWorkspaces(response.data.data || response.data)
    } catch (error) {
      toast.error("Failed to load workspaces")
    }
  }

  const checkAvailability = async () => {
    if (!selectedWorkspace || !selectedDate || !selectedTime) return

    setCheckingAvailability(true)
    try {
      const startTime = new Date(selectedDate)
      const [startHour, startMinute] = selectedTime.start.split(":")
      startTime.setHours(Number.parseInt(startHour), Number.parseInt(startMinute))

      const endTime = new Date(selectedDate)
      const [endHour, endMinute] = selectedTime.end.split(":")
      endTime.setHours(Number.parseInt(endHour), Number.parseInt(endMinute))

      const response = await api.get("/bookings/availability", {
        params: {
          workspace_id: selectedWorkspace.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        },
      })

      if (response.data.available) {
        setStep(3)
        toast.success("Time slot is available!")
      } else {
        toast.error("Time slot is not available. Please choose another time.")
      }
    } catch (error) {
      toast.error("Failed to check availability")
    } finally {
      setCheckingAvailability(false)
    }
  }

  const createBooking = async () => {
    if (!selectedWorkspace || !selectedDate || !selectedTime || !user) return

    setLoading(true)
    try {
      const startTime = new Date(selectedDate)
      const [startHour, startMinute] = selectedTime.start.split(":")
      startTime.setHours(Number.parseInt(startHour), Number.parseInt(startMinute))

      const endTime = new Date(selectedDate)
      const [endHour, endMinute] = selectedTime.end.split(":")
      endTime.setHours(Number.parseInt(endHour), Number.parseInt(endMinute))

      // Create transaction for deposit if needed
      if (bookingData.deposit > 0) {
        await api.post("/transactions", {
          user_id: user.id,
          type: "payment",
          amount: bookingData.deposit,
          description: `Deposit for ${selectedWorkspace.name} booking`,
        })
      }

      // Create booking
      await api.post("/bookings", {
        workspace_id: selectedWorkspace.id,
        user_id: user.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        deposit: bookingData.deposit,
        total_price: bookingData.total_price,
      })

      toast.success("Booking created successfully!")
      router.push("/app/bookings")
    } catch (error) {
      toast.error("Failed to create booking")
    } finally {
      setLoading(false)
    }
  }

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour <= 20; hour++) {
      slots.push({
        start: `${hour.toString().padStart(2, "0")}:00`,
        end: `${(hour + 1).toString().padStart(2, "0")}:00`,
        available: true,
      })
    }
    return slots
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Create New Booking</h1>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              1
            </div>
            <div className="w-8 h-0.5 bg-muted"></div>
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              2
            </div>
            <div className="w-8 h-0.5 bg-muted"></div>
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              3
            </div>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Select Workspace
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaces.map((workspace) => (
                  <motion.div key={workspace.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Card
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedWorkspace?.id === workspace.id ? "ring-2 ring-primary" : "",
                      )}
                      onClick={() => setSelectedWorkspace(workspace)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{workspace.name}</h3>
                        <p className="text-sm text-muted-foreground">{workspace.location}</p>
                        <div className="flex items-center gap-1 mt-2 text-sm">
                          <Users className="w-4 h-4" />
                          <span>Capacity: {workspace.capacity}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              <Button onClick={() => setStep(2)} disabled={!selectedWorkspace} className="w-full">
                Continue to Date & Time
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Select Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Select Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Select Time Slot</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {generateTimeSlots().map((slot) => (
                      <Button
                        key={`${slot.start}-${slot.end}`}
                        variant={selectedTime?.start === slot.start ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(slot)}
                        className="text-xs"
                      >
                        {slot.start} - {slot.end}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={checkAvailability}
                  disabled={!selectedDate || !selectedTime || checkingAvailability}
                  className="flex-1"
                >
                  {checkingAvailability ? "Checking..." : "Check Availability"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment & Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Booking Summary</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Workspace:</strong> {selectedWorkspace?.name}
                  </p>
                  <p>
                    <strong>Location:</strong> {selectedWorkspace?.location}
                  </p>
                  <p>
                    <strong>Date:</strong> {selectedDate ? format(selectedDate, "PPP") : ""}
                  </p>
                  <p>
                    <strong>Time:</strong> {selectedTime?.start} - {selectedTime?.end}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deposit">Deposit Amount</Label>
                  <Input
                    id="deposit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={bookingData.deposit}
                    onChange={(e) =>
                      setBookingData((prev) => ({ ...prev, deposit: Number.parseFloat(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="total_price">Total Price</Label>
                  <Input
                    id="total_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={bookingData.total_price}
                    onChange={(e) =>
                      setBookingData((prev) => ({ ...prev, total_price: Number.parseFloat(e.target.value) || 0 }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={createBooking} disabled={loading} className="flex-1">
                  {loading ? "Creating..." : "Create Booking"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
