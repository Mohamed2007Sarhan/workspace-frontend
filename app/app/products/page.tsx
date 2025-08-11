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
import { Plus, Search, Edit, Trash2, ShoppingCart, Package, DollarSign, TrendingUp, Users } from "lucide-react"
import { productsApi, usersApi, subscribersApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: number
  name: string
  price: number
  stock: number
  created_at: string
}

interface User {
  id: number
  name: string
  email: string
}

interface Subscriber {
  id: number
  user: {
    name: string
    email: string
  }
}

interface ProductFormData {
  name: string
  price: number
  stock: number
}

interface SaleFormData {
  product_id: number
  user_id: number
  quantity: number
}

interface ConsumeFormData {
  product_id: number
  subscriber_id: number
  quantity: number
}

interface StockUpdateFormData {
  product_id: number
  stock: number
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false)
  const [isConsumeDialogOpen, setIsConsumeDialogOpen] = useState(false)
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    price: 0,
    stock: 0,
  })
  const [saleFormData, setSaleFormData] = useState<SaleFormData>({
    product_id: 0,
    user_id: 0,
    quantity: 1,
  })
  const [consumeFormData, setConsumeFormData] = useState<ConsumeFormData>({
    product_id: 0,
    subscriber_id: 0,
    quantity: 1,
  })
  const [stockFormData, setStockFormData] = useState<StockUpdateFormData>({
    product_id: 0,
    stock: 0,
  })
  const [formLoading, setFormLoading] = useState(false)
  const { toast } = useToast()

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await productsApi.getProducts()
      const data = response.data.data || response.data
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch products:", error)
      toast({
        title: "Error",
        description: "Failed to fetch products. Please try again.",
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

  const fetchSubscribers = async () => {
    try {
      const response = await subscribersApi.getSubscribers({ per_page: 100 })
      const data = response.data.data || response.data
      setSubscribers(data.subscribers || data)
    } catch (error) {
      console.error("Failed to fetch subscribers:", error)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchUsers()
    fetchSubscribers()
  }, [])

  const handleCreateProduct = async () => {
    try {
      setFormLoading(true)
      await productsApi.createProduct(formData)
      toast({
        title: "Success",
        description: "Product created successfully.",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchProducts()
    } catch (error: any) {
      console.error("Failed to create product:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditProduct = async () => {
    if (!selectedProduct) return

    try {
      setFormLoading(true)
      await productsApi.updateProduct(selectedProduct.id, formData)
      toast({
        title: "Success",
        description: "Product updated successfully.",
      })
      setIsEditDialogOpen(false)
      resetForm()
      fetchProducts()
    } catch (error: any) {
      console.error("Failed to update product:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleSellProduct = async () => {
    try {
      setFormLoading(true)
      await productsApi.sellProduct(saleFormData)
      toast({
        title: "Success",
        description: "Product sold successfully.",
      })
      setIsSaleDialogOpen(false)
      resetSaleForm()
      fetchProducts()
    } catch (error: any) {
      console.error("Failed to sell product:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to sell product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleConsumeProduct = async () => {
    try {
      setFormLoading(true)
      await productsApi.consumeProduct(consumeFormData)
      toast({
        title: "Success",
        description: "Product consumed successfully.",
      })
      setIsConsumeDialogOpen(false)
      resetConsumeForm()
      fetchProducts()
    } catch (error: any) {
      console.error("Failed to consume product:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to consume product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateStock = async () => {
    try {
      setFormLoading(true)
      await productsApi.updateStock(stockFormData.product_id, { stock: stockFormData.stock })
      toast({
        title: "Success",
        description: "Stock updated successfully.",
      })
      setIsStockDialogOpen(false)
      resetStockForm()
      fetchProducts()
    } catch (error: any) {
      console.error("Failed to update stock:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update stock. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteProduct = async (product_id: number) => {
    try {
      await productsApi.deleteProduct(product_id)
      toast({
        title: "Success",
        description: "Product deleted successfully.",
      })
      fetchProducts()
    } catch (error: any) {
      console.error("Failed to delete product:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      price: 0,
      stock: 0,
    })
    setSelectedProduct(null)
  }

  const resetSaleForm = () => {
    setSaleFormData({
      product_id: 0,
      user_id: 0,
      quantity: 1,
    })
  }

  const resetConsumeForm = () => {
    setConsumeFormData({
      product_id: 0,
      subscriber_id: 0,
      quantity: 1,
    })
  }

  const resetStockForm = () => {
    setStockFormData({
      product_id: 0,
      stock: 0,
    })
  }

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      price: product.price,
      stock: product.stock,
    })
    setIsEditDialogOpen(true)
  }

  const openSaleDialog = (product: Product) => {
    setSaleFormData({
      product_id: product.id,
      user_id: 0,
      quantity: 1,
    })
    setIsSaleDialogOpen(true)
  }

  const openConsumeDialog = (product: Product) => {
    setConsumeFormData({
      product_id: product.id,
      subscriber_id: 0,
      quantity: 1,
    })
    setIsConsumeDialogOpen(true)
  }

  const openStockDialog = (product: Product) => {
    setStockFormData({
      product_id: product.id,
      stock: product.stock,
    })
    setIsStockDialogOpen(true)
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0)
      return { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Out of Stock" }
    if (stock <= 10)
      return { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", label: "Low Stock" }
    return { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "In Stock" }
  }

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))

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
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Product & Inventory Management</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage products, stock levels, and sales</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Product</DialogTitle>
                <DialogDescription>Add a new product to your inventory.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="create_name">Product Name</Label>
                  <Input
                    id="create_name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
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
                <div>
                  <Label htmlFor="create_stock">Initial Stock</Label>
                  <Input
                    id="create_stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number.parseInt(e.target.value) })}
                    placeholder="Enter initial stock quantity"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProduct} disabled={formLoading}>
                  {formLoading ? "Creating..." : "Create Product"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search products by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Products Table */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Products ({filteredProducts.length})</span>
            </CardTitle>
            <CardDescription>Manage your product inventory and sales</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">Loading products...</div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">No products found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock)
                      return (
                        <motion.tr key={product.id} variants={itemVariants}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <Package className="w-4 h-4 text-blue-700 dark:text-blue-200" />
                              </div>
                              <span>{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4 text-slate-400" />
                              <span className="font-medium">EGP {product.price.toFixed(2)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Package className="w-4 h-4 text-slate-400" />
                              <span className="font-medium">{product.stock} units</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={stockStatus.color} variant="secondary">
                              {stockStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span>{new Date(product.created_at).toLocaleDateString()}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openSaleDialog(product)}
                                className="text-green-600 hover:text-green-700"
                                disabled={product.stock === 0}
                              >
                                <ShoppingCart className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openConsumeDialog(product)}
                                className="text-purple-600 hover:text-purple-700"
                                disabled={product.stock === 0}
                              >
                                <Users className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openStockDialog(product)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <TrendingUp className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(product)}>
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
                                    <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {product.name}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteProduct(product.id)}
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
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information and pricing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Product Name</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
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
            <div>
              <Label htmlFor="edit_stock">Stock</Label>
              <Input
                id="edit_stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number.parseInt(e.target.value) })}
                placeholder="Enter stock quantity"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProduct} disabled={formLoading}>
              {formLoading ? "Updating..." : "Update Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sell Product Dialog */}
      <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sell Product</DialogTitle>
            <DialogDescription>Record a product sale to a customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sale_user">Customer</Label>
              <Select
                value={saleFormData.user_id.toString()}
                onValueChange={(value) => setSaleFormData({ ...saleFormData, user_id: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
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
              <Label htmlFor="sale_quantity">Quantity</Label>
              <Input
                id="sale_quantity"
                type="number"
                min="1"
                value={saleFormData.quantity}
                onChange={(e) => setSaleFormData({ ...saleFormData, quantity: Number.parseInt(e.target.value) })}
                placeholder="Enter quantity"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSellProduct} disabled={formLoading}>
              {formLoading ? "Processing..." : "Sell Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consume Product Dialog */}
      <Dialog open={isConsumeDialogOpen} onOpenChange={setIsConsumeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Consume Product</DialogTitle>
            <DialogDescription>Record product consumption by a subscriber.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="consume_subscriber">Subscriber</Label>
              <Select
                value={consumeFormData.subscriber_id.toString()}
                onValueChange={(value) =>
                  setConsumeFormData({ ...consumeFormData, subscriber_id: Number.parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subscriber" />
                </SelectTrigger>
                <SelectContent>
                  {subscribers.map((subscriber) => (
                    <SelectItem key={subscriber.id} value={subscriber.id.toString()}>
                      {subscriber.user.name} ({subscriber.user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="consume_quantity">Quantity</Label>
              <Input
                id="consume_quantity"
                type="number"
                min="1"
                value={consumeFormData.quantity}
                onChange={(e) => setConsumeFormData({ ...consumeFormData, quantity: Number.parseInt(e.target.value) })}
                placeholder="Enter quantity"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConsumeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConsumeProduct} disabled={formLoading}>
              {formLoading ? "Processing..." : "Consume Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Stock Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
            <DialogDescription>Update the stock level for this product.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="stock_quantity">New Stock Level</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={stockFormData.stock}
                onChange={(e) => setStockFormData({ ...stockFormData, stock: Number.parseInt(e.target.value) })}
                placeholder="Enter new stock level"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStockDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStock} disabled={formLoading}>
              {formLoading ? "Updating..." : "Update Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
