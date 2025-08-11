"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, TrendingUp, TrendingDown, DollarSign, Receipt } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface FinancialData {
  total_revenue: number
  total_expenses: number
  net_profit: number
  transaction_count: number
  daily_data: Array<{
    date: string
    revenue: number
    expenses: number
  }>
}

export default function FinancialReportsPage() {
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })
  const [groupBy, setGroupBy] = useState<"day" | "month">("day")
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)

  useEffect(() => {
    fetchFinancialData()
  }, [dateRange, groupBy])

  const fetchFinancialData = async () => {
    setLoading(true)
    try {
      const response = await api.get("/dashboard/financial", {
        params: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
          group_by: groupBy,
        },
      })
      setFinancialData(response.data)
    } catch (error) {
      toast.error("Failed to load financial data")
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    try {
      const response = await api.get("/transactions/report", {
        params: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
          group_by: groupBy,
          format: "csv",
        },
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `financial-report-${format(new Date(), "yyyy-MM-dd")}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success("Report exported successfully!")
    } catch (error) {
      toast.error("Failed to export report")
    }
  }

  return (
    <div className="container mx-auto p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Financial Reports</h1>
            <p className="text-muted-foreground">Comprehensive financial analytics and reporting</p>
          </div>
          <Button onClick={exportReport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange((prev) => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.to && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange((prev) => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Group By</Label>
                <Select value={groupBy} onValueChange={(value: "day" | "month") => setGroupBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={fetchFinancialData} disabled={loading} className="w-full">
                  {loading ? "Loading..." : "Generate Report"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {financialData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">EGP {financialData.total_revenue.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">EGP {financialData.total_expenses.toFixed(2)}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                    <p
                      className={cn(
                        "text-2xl font-bold",
                        financialData.net_profit >= 0 ? "text-green-600" : "text-red-600",
                      )}
                    >
                      EGP {financialData.net_profit.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold">{financialData.transaction_count}</p>
                  </div>
                  <Receipt className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {financialData?.daily_data && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financialData.daily_data.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{format(new Date(item.date), "PPP")}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-green-600">Revenue: EGP {item.revenue.toFixed(2)}</div>
                      <div className="text-red-600">Expenses: EGP {item.expenses.toFixed(2)}</div>
                      <div
                        className={cn(
                          "font-medium",
                          item.revenue - item.expenses >= 0 ? "text-green-600" : "text-red-600",
                        )}
                      >
                        Net: EGP {(item.revenue - item.expenses).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
