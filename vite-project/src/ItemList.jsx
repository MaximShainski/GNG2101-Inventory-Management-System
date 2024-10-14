import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const ItemList = () => {
  const [items, setItems] = useState([]);

  const fetchItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, 'Wheelchair')); // Change to your actual collection name
      const fetchedItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Fetched items:', fetchedItems);
      setItems(fetchedItems);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div>
      <h1>Your Items</h1>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            <p>Name: {item.Name}</p> {/* Change to your actual field name */}
            <p>Description: {item.id}</p> {/* Change to your actual field name */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ItemList;
