import { useState, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { useSearch } from '../hooks/useSearch';
import { useBulkSelection } from '../hooks/useBulkSelection';
import { BulkActionBar } from '../components/BulkActionBar';
import { Stores } from '../db';
import type { User } from '../types';

export function Users() {
  const { isReady, initError, operationLoading, operationError, create, getAll, update, remove } = useDatabase();
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  
  const { searchTerm, setSearchTerm, filteredData: filteredUsers, clearSearch, isSearching } = useSearch(
    users,
    ['name', 'email'],
    300
  );

  const bulkSelection = useBulkSelection(filteredUsers, 'userId');

  useEffect(() => {
    if (isReady) {
      loadUsers();
    }
  }, [isReady]);

  const loadUsers = async () => {
    const result = await getAll<User>(Stores.Users);
    if (result) {
      setUsers(result);
    }
  };

  const createUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    
    const userData: Omit<User, 'userId'> = {
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      createdAt: new Date(),
    };
    
    const result = await create(Stores.Users, userData);
    if (result) {
      setNewUserName('');
      setNewUserEmail('');
      await loadUsers();
    }
  };

  const deleteUser = async (userId: number) => {
    const result = await remove(Stores.Users, userId);
    if (result) {
      await loadUsers();
    }
  };

  const startEdit = (user: User) => {
    if (user.userId) {
      setEditingUserId(user.userId);
      setEditUserName(user.name);
      setEditUserEmail(user.email);
    }
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditUserName('');
    setEditUserEmail('');
  };

  const saveEdit = async () => {
    if (!editingUserId || !editUserName.trim() || !editUserEmail.trim()) return;

    const updatedData = {
      name: editUserName.trim(),
      email: editUserEmail.trim(),
    };

    const createDefault = (): User => ({
      name: editUserName.trim(),
      email: editUserEmail.trim(),
      createdAt: new Date(),
    });

    const result = await update(Stores.Users, editingUserId, updatedData, createDefault);
    if (result) {
      setEditingUserId(null);
      setEditUserName('');
      setEditUserEmail('');
      await loadUsers();
    }
  };

  const bulkDelete = async () => {
    const selectedItems = bulkSelection.selectedItems;
    let successCount = 0;
    
    for (const user of selectedItems) {
      if (user.userId) {
        const result = await remove(Stores.Users, user.userId);
        if (result) successCount++;
      }
    }
    
    if (successCount > 0) {
      bulkSelection.clearSelection();
      await loadUsers();
    }
    
    if (successCount !== selectedItems.length) {
      alert(`${successCount} of ${selectedItems.length} users deleted successfully.`);
    }
  };

  const bulkExport = () => {
    const selectedItems = bulkSelection.selectedItems;
    const dataStr = JSON.stringify(selectedItems, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `users_export_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!isReady && !initError) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading database...</div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Database Error</h2>
        <p className="text-red-600">{initError}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Users Management</h1>
      
      {/* Create User Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New User</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Name"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={createUser}
            disabled={operationLoading || !newUserName.trim() || !newUserEmail.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {operationLoading ? 'Adding...' : 'Add User'}
          </button>
        </div>
        {operationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{operationError}</p>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={bulkSelection.selectedCount}
        onBulkDelete={bulkDelete}
        onBulkExport={bulkExport}
        onClearSelection={bulkSelection.clearSelection}
        isLoading={operationLoading}
      />

      {/* Users List */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Users List</h2>
            {filteredUsers.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={bulkSelection.isAllSelected}
                  ref={checkbox => {
                    if (checkbox) checkbox.indeterminate = bulkSelection.isSomeSelected;
                  }}
                  onChange={bulkSelection.toggleSelectAll}
                  className="rounded border-gray-300"
                />
                Select all
              </label>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 pl-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
              <svg
                className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {isSearching && (
              <button
                onClick={clearSearch}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        {operationLoading && (
          <div className="text-center py-4">
            <div className="text-gray-600">Loading...</div>
          </div>
        )}
        
        {filteredUsers.length === 0 && !operationLoading ? (
          <div className="text-center py-8 text-gray-500">
            {isSearching ? `No users found matching "${searchTerm}"` : 'No users found. Add your first user above!'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.userId} className="p-4 border border-gray-200 rounded-lg">
                {editingUserId === user.userId ? (
                  // Edit mode
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editUserName}
                        onChange={(e) => setEditUserName(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Name"
                      />
                      <input
                        type="email"
                        value={editUserEmail}
                        onChange={(e) => setEditUserEmail(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Email"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={operationLoading || !editUserName.trim() || !editUserEmail.trim()}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {operationLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={operationLoading}
                        className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={user.userId ? bulkSelection.isSelected(user.userId) : false}
                        onChange={() => user.userId && bulkSelection.toggleSelection(user.userId)}
                        className="rounded border-gray-300"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          Created: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(user)}
                        disabled={operationLoading || editingUserId !== null}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => user.userId && deleteUser(user.userId)}
                        disabled={operationLoading || editingUserId !== null}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}