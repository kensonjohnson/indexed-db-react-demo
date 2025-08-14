import { useState, useEffect } from 'react';
import { useOptimisticUpdate } from '../hooks/useOptimisticUpdate';
import { useSearch } from '../hooks/useSearch';
import { Stores } from '../db';
import type { User } from '../types';

export function OptimisticUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');

  const optimistic = useOptimisticUpdate<User>(Stores.Users, 'userId');
  const { database } = optimistic;

  const { searchTerm, setSearchTerm, filteredData: filteredUsers, clearSearch, isSearching } = useSearch(
    users,
    ['name', 'email'],
    300
  );

  useEffect(() => {
    if (database.isReady) {
      loadUsers();
    }
  }, [database.isReady]);

  const loadUsers = async () => {
    const result = await database.getAll<User>(Stores.Users);
    if (result) {
      setUsers(result);
    }
  };

  // OPTIMISTIC CREATE - UI updates immediately, then syncs with DB
  const createUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const userData = {
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      createdAt: new Date(),
    };

    // Clear form immediately (optimistic UX)
    setNewUserName('');
    setNewUserEmail('');

    const result = await optimistic.optimisticCreate(userData);
    
    if (result.success) {
      // Add optimistic item to local state immediately
      if (result.item) {
        setUsers(prev => [...prev, result.item as User]);
      }
      
      // Clean up the operation after a delay
      setTimeout(() => {
        optimistic.clearOperation(result.operationId);
        // Reload to get the real data with actual ID
        loadUsers();
      }, 2000);
    } else {
      // Rollback form state on error
      setNewUserName(userData.name);
      setNewUserEmail(userData.email);
      alert(`Failed to create user: ${result.error}`);
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

  // OPTIMISTIC UPDATE - Changes appear instantly, then sync with DB
  const saveEdit = async () => {
    if (!editingUserId || !editUserName.trim() || !editUserEmail.trim()) return;

    const originalUser = users.find(u => u.userId === editingUserId);
    if (!originalUser) return;

    const updates = {
      name: editUserName.trim(),
      email: editUserEmail.trim(),
    };

    const createDefault = (): User => ({
      name: editUserName.trim(),
      email: editUserEmail.trim(),
      createdAt: new Date(),
    });

    // Update local state immediately (optimistic)
    setUsers(prev => prev.map(user => 
      user.userId === editingUserId 
        ? { ...user, ...updates }
        : user
    ));

    // Clear editing state immediately (optimistic UX)
    setEditingUserId(null);
    setEditUserName('');
    setEditUserEmail('');

    const result = await optimistic.optimisticUpdate(editingUserId, updates, originalUser, createDefault);
    
    if (result.success) {
      // Update with confirmed data
      if (result.item) {
        setUsers(prev => prev.map(user => 
          user.userId === editingUserId 
            ? result.item as User
            : user
        ));
      }
      
      // Clean up the operation
      setTimeout(() => {
        optimistic.clearOperation(result.operationId);
      }, 1000);
    } else {
      // Rollback on error
      setUsers(prev => prev.map(user => 
        user.userId === editingUserId 
          ? originalUser
          : user
      ));
      
      // Restore editing state for retry
      setEditingUserId(editingUserId);
      setEditUserName(originalUser.name);
      setEditUserEmail(originalUser.email);
      
      alert(`Failed to update user: ${result.error}`);
    }
  };

  // OPTIMISTIC DELETE - Item disappears immediately, then syncs with DB
  const deleteUser = async (userId: number) => {
    const userToDelete = users.find(u => u.userId === userId);
    if (!userToDelete) return;

    // Remove from local state immediately (optimistic)
    setUsers(prev => prev.filter(user => user.userId !== userId));

    const result = await optimistic.optimisticDelete(userId, userToDelete);
    
    if (result.success) {
      // Clean up the operation
      setTimeout(() => {
        optimistic.clearOperation(result.operationId);
      }, 1000);
    } else {
      // Rollback - restore the user to the list
      setUsers(prev => [...prev, userToDelete].sort((a, b) => 
        (a.userId || 0) - (b.userId || 0)
      ));
      
      alert(`Failed to delete user: ${result.error}`);
    }
  };

  if (!database.isReady && !database.initError) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading database...</div>
      </div>
    );
  }

  if (database.initError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Database Error</h2>
        <p className="text-red-600">{database.initError}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Users Management (Optimistic Updates)</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">🚀 Optimistic Update Pattern</h3>
          <p className="text-blue-700 text-sm">
            This component demonstrates <strong>optimistic updates</strong>: changes appear immediately in the UI, 
            then sync with the database. If the database operation fails, the UI automatically rolls back.
            Compare this with the traditional Users page to see the difference in user experience.
          </p>
        </div>
      </div>

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
            disabled={!newUserName.trim() || !newUserEmail.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add User (Instant)
          </button>
        </div>
        {database.operationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{database.operationError}</p>
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Users List</h2>
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

        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {isSearching ? `No users found matching "${searchTerm}"` : 'No users found. Add your first user above!'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const optimisticState = optimistic.getOptimisticState(user.userId);
              
              return (
                <div key={user.userId} className="p-4 border border-gray-200 rounded-lg relative">
                  {/* Optimistic State Indicator */}
                  {optimisticState && (
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {optimisticState.isPending && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⏳ Syncing...
                        </span>
                      )}
                      {optimisticState.isConfirmed && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ Synced
                        </span>
                      )}
                      {optimisticState.isError && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ❌ Failed
                        </span>
                      )}
                    </div>
                  )}

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
                          disabled={!editUserName.trim() || !editUserEmail.trim()}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          Save (Instant)
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <div className="flex items-center justify-between">
                      <div className="pr-20"> {/* Add padding to avoid overlap with status indicators */}
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          Created: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(user)}
                          disabled={editingUserId !== null}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => user.userId && deleteUser(user.userId)}
                          disabled={editingUserId !== null}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          Delete (Instant)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}