import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast"

const AdminDashboard = () => {
  const [transactionType, setTransactionType] = useState('item');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWheelchair, setSelectedWheelchair] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    category: ''
  });

  const [addDialogOpen, setAddDialogOpen] = useState(false); // State for the Add Item dialog
  const [newWheelchair, setNewWheelchair] = useState({
    serialNumber: '',
    name: '',
    category: ''
  });

  const handleItemClick = async (serialNumber) => {
    console.log('handleItemClick triggered with:', serialNumber);
    try {
      const wheelchairDoc = await getDoc(doc(firestore, 'Wheelchair', serialNumber));
      if (wheelchairDoc.exists()) {
        const data = wheelchairDoc.data();
        setSelectedWheelchair(serialNumber);
        setEditForm({
          name: data.Name || '',
          category: data.Category || ''
        });
        setEditDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: "Wheelchair not found in database",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching wheelchair:', error);
      toast({
        title: "Error",
        description: "Failed to fetch wheelchair details",
        variant: "destructive",
      });
    }
  };

  const handleUpdateWheelchair = async () => {
    try {
      await updateDoc(doc(firestore, 'Wheelchair', selectedWheelchair), {
        Name: editForm.name,
        Category: editForm.category
      });

      toast({
        title: "Success",
        description: "Wheelchair updated successfully",
      });

      setEditDialogOpen(false);
      fetchTransactions(); // Refresh the list
    } catch (error) {
      console.error('Error updating wheelchair:', error);
      toast({
        title: "Error",
        description: "Failed to update wheelchair",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWheelchair = async () => {
    try {
      await deleteDoc(doc(firestore, 'Wheelchair', selectedWheelchair));
      
      toast({
        title: "Success",
        description: "Wheelchair deleted successfully",
      });

      setDeleteDialogOpen(false);
      setEditDialogOpen(false);
      fetchTransactions(); // Refresh the list
    } catch (error) {
      console.error('Error deleting wheelchair:', error);
      toast({
        title: "Error",
        description: "Failed to delete wheelchair",
        variant: "destructive",
      });
    }
  };

  // Function to handle adding a new wheelchair
  const handleAddWheelchair = async () => {
    if (!newWheelchair.serialNumber || !newWheelchair.name || !newWheelchair.category) {
      alert("Please fill in all fields.");
      return;
    }
  
    try {
      // Create the wheelchair document with the serial number as the document ID
      await setDoc(doc(firestore, "Wheelchair", newWheelchair.serialNumber), {
        Name: newWheelchair.name,
        Category: newWheelchair.category,
      });
  
      // Close the dialog after adding the wheelchair
      setAddDialogOpen(false);
  
      // Reset form data
      setNewWheelchair({
        serialNumber: "",
        name: "",
        category: "",
      });
  
      // Optionally show a success message
      alert("New wheelchair added successfully.");
    } catch (error) {
      console.error("Error adding wheelchair: ", error);
      alert("Error adding wheelchair. Please try again.");
    }
  };
  

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const baseQuery = query(
        collection(firestore, 'TransactionLogs'),
        where('timestamp', '>=', dateRange.from),
        where('timestamp', '<=', dateRange.to),
        orderBy('timestamp', 'desc')
      );
  
      if (searchQuery.trim()) {
        if (transactionType === 'item') {
          // Fetch all items and filter on the client side
          const snapshot = await getDocs(baseQuery);
          const allItems = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
  
          const filteredItems = allItems.filter(item =>
            (item.itemSerialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
             item.itemName?.toLowerCase().includes(searchQuery.toLowerCase()))
          );
  
          setTransactions(filteredItems);
        } else {
          // Fetch all users and filter on the client side
          const snapshot = await getDocs(baseQuery);
          const allUsers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
  
          const filteredUsers = allUsers.filter(user =>
            user.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
          );
  
          setTransactions(filteredUsers);
        }
      } else {
        // No search query, fetch all transactions
        const snapshot = await getDocs(baseQuery);
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTransactions(results);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
    setLoading(false);
  };
  

  useEffect(() => {
    fetchTransactions();
  }, [dateRange, transactionType, searchQuery]);

  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;
  const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transactions.length / pageSize);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Transaction History</h1>
  
      <div className="flex space-x-4 mb-4">
        <Select 
          value={transactionType} 
          onValueChange={setTransactionType}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Transaction Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="item">Item History</SelectItem>
            <SelectItem value="user">User History</SelectItem>
          </SelectContent>
        </Select>
  
        <Input 
          placeholder={`Search ${transactionType === 'item' ? 'Item Serial' : 'User Email'}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow"
        />
  
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
            />
          </PopoverContent>
        </Popover>
  
        <Select 
          value={pageSize.toString()} 
          onValueChange={(value) => {
            const newPageSize = Number(value);
            setPageSize(newPageSize);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Items per page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="20">20 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
            <SelectItem value="100">100 per page</SelectItem>
          </SelectContent>
        </Select>
  
        <Button onClick={() => setAddDialogOpen(true)}>Add New Wheelchair</Button>
      </div>
  
      <div className="w-full overflow-x-auto border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Serial</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentTransactions.map(transaction => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {transaction.timestamp?.toDate().toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleItemClick(transaction.itemSerialNumber)}
                    className="text-black hover:text-blue-800 hover:underline focus:outline-none"
                  >
                    {transaction.itemSerialNumber}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{transaction.itemName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{transaction.userEmail}</td>
                <td className="px-6 py-4 whitespace-nowrap">{transaction.actionType}</td>
                <td className="px-6 py-4 whitespace-nowrap">{transaction.floor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

       {/* Edit Wheelchair Dialog */}
       <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Wheelchair Details</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input
                id="category"
                value={editForm.category}
                onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Wheelchair</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the wheelchair
                    with serial number {selectedWheelchair} from the database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteWheelchair}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button onClick={handleUpdateWheelchair}>Update Wheelchair</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog for Adding Wheelchair */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Wheelchair</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="serialNumber" className="text-right">
                Serial Number
              </Label>
              <Input
                id="serialNumber"
                value={newWheelchair.serialNumber}
                onChange={(e) =>
                  setNewWheelchair((prev) => ({ ...prev, serialNumber: e.target.value }))
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newWheelchair.name}
                onChange={(e) =>
                  setNewWheelchair((prev) => ({ ...prev, name: e.target.value }))
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input
                id="category"
                value={newWheelchair.category}
                onChange={(e) =>
                  setNewWheelchair((prev) => ({ ...prev, category: e.target.value }))
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWheelchair}>Add Wheelchair</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
        <div className="flex items-center">
          <p className="text-sm text-gray-700">
            Showing{' '}
            <span className="font-medium">
              {transactions.length > 0 ? indexOfFirstItem + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-medium">
              {Math.min(indexOfLastItem, transactions.length)}
            </span>{' '}
            of <span className="font-medium">{transactions.length}</span> results
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
            disabled={currentPage === 1}
          >
            Previous
          </Button>
  
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <Button
              key={page}
              onClick={() => setCurrentPage(page)}
              variant={page === currentPage ? 'default' : 'outline'}
            >
              {page}
            </Button>
          ))}
  
          <Button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;