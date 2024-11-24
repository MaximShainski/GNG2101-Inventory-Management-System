import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Loader2 } from "lucide-react";

const ItemList = ({userEmail}) => {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [floor, setFloor] = useState(null);
  const [secondSelection, setSecondSelection] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [showFirstModal, setShowFirstModal] = useState(true);
  const [showSecondModal, setShowSecondModal] = useState(false);
  const [showThirdModal, setShowThirdModal] = useState(false);
  const [inputError, setInputError] = useState('');
  const [parsedInput, setParsedInput] = useState({serialNumber: '' });
  const [retrievedName, setRetrievedName] = useState('');
  const [queryError, setQueryError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / pageSize);

  const fetchItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, 'Wheelchair'));
      const fetchedItems = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        Category: doc.data().Category || '',
        Name: doc.data().Name || '',
        Floor: doc.data().Floor || '',
        checkedIn: doc.data().checkedIn ?? true,
        personLastInteracted: doc.data().personLastInteracted || ''
      }));
      setItems(fetchedItems);
      setFilteredItems(fetchedItems);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
  
    pageNumbers.push(1);
  
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
  
    if (currentPage > 3) {
      pageNumbers.push('...');
    }
  
    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }
  
    if (currentPage < totalPages - 2) {
      pageNumbers.push('...');
    }
  
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
  
    return pageNumbers;
  };

  const logTransaction = async (transactionData) => {
    try {
      await addDoc(collection(firestore, 'TransactionLogs'), {
        ...transactionData,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging transaction:', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const filtered = items.filter(item => 
      item.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.Category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.personLastInteracted && item.personLastInteracted.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.Floor && item.Floor.toString().includes(searchQuery))
    );
    setFilteredItems(filtered);
    setCurrentPage(1);
  }, [searchQuery, items]);

  const handleFloorChange = (value) => {
    setFloor(value);
  };

  const handleSecondSelectChange = (value) => {
    setSecondSelection(value);
  };

  const parseInput = (input) => {
    setInputError('');
    setQueryError('');
    
    if (!input) {
      setInputError('Input can not be empty');
      return false;
    }

    const serialNumber = input.trim();

    if (!serialNumber) {
      setInputError('Serial number required');
      return false;
    }

    setParsedInput({serialNumber });
    return true;
  };

  const handleTextInputChange = (e) => {
    const newValue = e.target.value;
    setTextInput(newValue);
    parseInput(newValue);
  };

  const handleThirdConfirm = async () => {
    if (isSubmitting) return;
    
    if (!parseInput(textInput)) {
      return;
    }
  
    setIsSubmitting(true);
    try {
      const docRef = doc(firestore, "Wheelchair", parsedInput.serialNumber);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const name = docSnap.data().Name;
        if (name) {
          setRetrievedName(name);
          
          await updateDoc(docRef, {
            Floor: floor,
            checkedIn: secondSelection === 'checkIn',
            [`last${secondSelection}Time`]: new Date().toLocaleString("en-US", {
              timeZone: "America/New_York"
            }),
            personLastInteracted: userEmail
          });

          await logTransaction({
            itemSerialNumber: parsedInput.serialNumber,
            itemName: name,
            userEmail: userEmail,
            actionType: secondSelection,
            floor: floor,
          });
          
          setShowThirdModal(false);
          await fetchItems();
          
          setFloor(null);
          setSecondSelection(null);
          setTextInput('');
          setParsedInput({serialNumber: '' });
          setInputError('');
          setQueryError('');
          setRetrievedName('');
        } else {
          setQueryError('No name field found in the document');
        }
      } else {
        setQueryError('No matching document found');
      }
    } catch (error) {
      console.error('Error updating document:', error);
      setQueryError('Error updating data in Firebase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInteractClick = (item) => {
    setFloor(null);
    setSecondSelection(null);
    setTextInput('');
    setParsedInput({serialNumber: '' });
    setInputError('');
    setQueryError('');
    setRetrievedName('');
    
    const preFilledInput = `${item.id}`;
    setTextInput(preFilledInput);
    parseInput(preFilledInput);
    
    setShowFirstModal(true);
  };

  return (
    <div className="p-4">
      {userEmail && (
        <div className="mb-6 flex items-center justify-end space-x-2 text-gray-600">
          <User className="h-4 w-4" />
          <span>{userEmail}</span>
        </div>
      )}

      <Dialog open={showFirstModal} onOpenChange={setShowFirstModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select your floor</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4">
            <Select onValueChange={handleFloorChange} value={floor}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="1">Floor 1</SelectItem>
                  <SelectItem value="2">Floor 2</SelectItem>
                  <SelectItem value="3">Floor 3</SelectItem>
                  <SelectItem value="4">Floor 4</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button 
              onClick={() => {
                if (floor) {
                  setShowFirstModal(false);
                  setShowSecondModal(true);
                }
              }}
              disabled={!floor}
              className="w-full"
            >
              Next
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSecondModal} onOpenChange={setShowSecondModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check in or check out?</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4">
            <Select onValueChange={handleSecondSelectChange} value={secondSelection}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an action" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="checkIn">Check in</SelectItem>
                  <SelectItem value="checkOut">Check out</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button 
              onClick={() => {
                if (secondSelection) {
                  setShowSecondModal(false);
                  setShowThirdModal(true);
                }
              }}
              disabled={!secondSelection}
              className="w-full"
            >
              Next
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showThirdModal} onOpenChange={setShowThirdModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Additional Information</DialogTitle>
            <DialogDescription>
              Enter serial number
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4">
            <Input
              type="text"
              value={textInput}
              onChange={handleTextInputChange}
              className="w-full"
            />

            {inputError && (
              <Alert variant="destructive">
                <AlertDescription>{inputError}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleThirdConfirm}
              disabled={!textInput.trim() || !!inputError || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {(floor || secondSelection || retrievedName || queryError) && (
        <div className="mt-4 space-y-2">
          {floor && (
            <p className="text-lg font-medium">Selected Floor: {floor}</p>
          )}
          {secondSelection && (
            <p className="text-lg font-medium">Action: {secondSelection}</p>
          )}
          {parsedInput.serialNumber && (
            <div>
              <p className="text-lg font-medium">Serial Number: {parsedInput.serialNumber}</p>
            </div>
          )}
          {retrievedName && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Retrieved Name: {retrievedName}
              </AlertDescription>
            </Alert>
          )}
          {queryError && (
            <Alert variant="destructive">
              <AlertDescription>{queryError}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="w-full px-4 py-8">
        <div className="w-full overflow-x-auto border rounded-lg mb-4">
          <div className="flex items-center justify-between gap-4 p-4">
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="text-sm text-gray-500">
              Total results: {filteredItems.length}
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Checked Out To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interact</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.Name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.Category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {!item.checkedIn && item.personLastInteracted ? item.personLastInteracted : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.Floor || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button
                      onClick={() => handleInteractClick(item)}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Interact
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {filteredItems.length > 0 ? indexOfFirstItem + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(indexOfLastItem, filteredItems.length)}
              </span>{' '}
              of <span className="font-medium">{filteredItems.length}</span> results
            </p>
          </div>
          
          <div className="flex gap-1">
            {getPageNumbers().map((pageNum, index) => (
              pageNum === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2 py-1">...</span>
              ) : (
                <Button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  disabled={pageNum === currentPage}
                >
                  {pageNum}
                </Button>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemList;