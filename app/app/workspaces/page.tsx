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
import { Plus, Edit, Trash2, Building, MapPin, Users } from "lucide-react"
import { workspacesApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Workspace {
  id: number
  name: string
  location: string
  capacity: number
  created_at: string
}

interface WorkspaceFormData {
  name: string
  location: string
  capacity: number
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

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [formData, setFormData] = useState<WorkspaceFormData>({
    name: "",
    location: "",
    capacity: 1,
  })
  const [formLoading, setFormLoading] = useState(false)
  const { toast } = useToast()

  const fetchWorkspaces = async () => {
    try {
      setLoading(true)
      const response = await workspacesApi.getWorkspaces()
      const data = response.data.data || response.data
      setWorkspaces(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch workspaces:", error)
      toast({
        title: "Error",
        description: "Failed to fetch workspaces. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const handleCreateWorkspace = async () => {
    try {
      setFormLoading(true)
      await workspacesApi.createWorkspace(formData)
      toast({
        title: "Success",
        description: "Workspace created successfully.",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchWorkspaces()
    } catch (error: any) {
      console.error("Failed to create workspace:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create workspace. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditWorkspace = async () => {
    if (!selectedWorkspace) return

    try {
      setFormLoading(true)
      await workspacesApi.updateWorkspace(selectedWorkspace.id, formData)
      toast({
        title: "Success",
        description: "Workspace updated successfully.",
      })
      setIsEditDialogOpen(false)
      resetForm()
      fetchWorkspaces()
    } catch (error: any) {
      console.error("Failed to update workspace:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update workspace. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteWorkspace = async (workspace_id: number) => {
    try {
      await workspacesApi.deleteWorkspace(workspace_id)
      toast({
        title: "Success",
        description: "Workspace deleted successfully.",
      })
      fetchWorkspaces()
    } catch (error: any) {
      console.error("Failed to delete workspace:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete workspace. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      capacity: 1,
    })
    setSelectedWorkspace(null)
  }

  const openEditDialog = (workspace: Workspace) => {
    setSelectedWorkspace(workspace)
    setFormData({
      name: workspace.name,
      location: workspace.location,
      capacity: workspace.capacity,
    })
    setIsEditDialogOpen(true)
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
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Workspaces</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage workspace locations and capacity</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Workspace
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
                <DialogDescription>Add a new workspace location with capacity details.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="create_name">Workspace Name</Label>
                  <Input
                    id="create_name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter workspace name"
                  />
                </div>
                <div>
                  <Label htmlFor="create_location">Location</Label>
                  <Input
                    id="create_location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <Label htmlFor="create_capacity">Capacity</Label>
                  <Input
                    id="create_capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number.parseInt(e.target.value) })}
                    placeholder="Enter capacity"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkspace} disabled={formLoading}>
                  {formLoading ? "Creating..." : "Create Workspace"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Workspaces Table */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5" />
              <span>Workspaces ({workspaces.length})</span>
            </CardTitle>
            <CardDescription>Manage workspace locations and their booking capacity</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">Loading workspaces...</div>
              </div>
            ) : workspaces.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">No workspaces found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workspaces.map((workspace) => (
                      <motion.tr key={workspace.id} variants={itemVariants}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <Building className="w-4 h-4 text-blue-700 dark:text-blue-200" />
                            </div>
                            <span>{workspace.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span>{workspace.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{workspace.capacity} people</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span>{new Date(workspace.created_at).toLocaleDateString()}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(workspace)}>
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
                                  <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {workspace.name}? This action cannot be undone and
                                    will affect all related bookings.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteWorkspace(workspace.id)}
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

      {/* Edit Workspace Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>Update workspace information and capacity.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Workspace Name</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter workspace name"
              />
            </div>
            <div>
              <Label htmlFor="edit_location">Location</Label>
              <Input
                id="edit_location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter location"
              />
            </div>
            <div>
              <Label htmlFor="edit_capacity">Capacity</Label>
              <Input
                id="edit_capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number.parseInt(e.target.value) })}
                placeholder="Enter capacity"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditWorkspace} disabled={formLoading}>
              {formLoading ? "Updating..." : "Update Workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
