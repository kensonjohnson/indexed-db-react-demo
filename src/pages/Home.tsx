import { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Stores } from '../db';
import { sampleUsers, sampleSkills } from '../utils/sampleData';

export function Home() {
  const { isReady, operationLoading, create, getAll, clearStore } = useDatabase();
  const [isPopulating, setIsPopulating] = useState(false);
  const [populateStatus, setPopulateStatus] = useState<string | null>(null);

  const populateSampleData = async () => {
    if (!isReady) return;
    
    setIsPopulating(true);
    setPopulateStatus('Checking existing data...');

    try {
      // Check if data already exists
      const existingUsers = await getAll(Stores.Users);
      const existingSkills = await getAll(Stores.Skills);

      if ((existingUsers && existingUsers.length > 0) || (existingSkills && existingSkills.length > 0)) {
        setPopulateStatus('Sample data already exists. Clear data first if you want to repopulate.');
        setTimeout(() => setPopulateStatus(null), 3000);
        setIsPopulating(false);
        return;
      }

      // Populate users
      setPopulateStatus(`Adding ${sampleUsers.length} sample users...`);
      for (const user of sampleUsers) {
        await create(Stores.Users, user);
      }

      // Populate skills
      setPopulateStatus(`Adding ${sampleSkills.length} sample skills...`);
      for (const skill of sampleSkills) {
        await create(Stores.Skills, skill);
      }

      setPopulateStatus('Sample data populated successfully! 🎉');
      setTimeout(() => setPopulateStatus(null), 3000);
    } catch (error) {
      setPopulateStatus('Failed to populate sample data.');
      setTimeout(() => setPopulateStatus(null), 3000);
      console.error('Error populating sample data:', error);
    } finally {
      setIsPopulating(false);
    }
  };

  const clearAllData = async () => {
    if (!isReady) return;
    
    setIsPopulating(true);
    setPopulateStatus('Clearing all data...');

    try {
      const usersCleared = await clearStore(Stores.Users);
      const skillsCleared = await clearStore(Stores.Skills);

      if (usersCleared && skillsCleared) {
        setPopulateStatus('All data cleared successfully! 🗑️');
      } else {
        setPopulateStatus('Failed to clear some data.');
      }
      setTimeout(() => setPopulateStatus(null), 3000);
    } catch (error) {
      setPopulateStatus('Failed to clear data.');
      setTimeout(() => setPopulateStatus(null), 3000);
      console.error('Error clearing data:', error);
    } finally {
      setIsPopulating(false);
    }
  };

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        IndexedDB Demo App
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        A React application showcasing IndexedDB with custom hooks and React Router v7
      </p>

      {/* Sample Data Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Quick Start</h2>
        <p className="text-blue-700 mb-4">
          Populate the database with sample data to explore the features
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={populateSampleData}
            disabled={!isReady || isPopulating || operationLoading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPopulating ? 'Working...' : 'Populate Sample Data'}
          </button>
          <button
            onClick={clearAllData}
            disabled={!isReady || isPopulating || operationLoading}
            className="px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPopulating ? 'Working...' : 'Clear All Data'}
          </button>
        </div>
        {populateStatus && (
          <div className="mt-3 p-3 bg-white border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">{populateStatus}</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Users Store</h2>
          <p className="text-gray-600">
            Manage user records with IndexedDB. Create, read, update, and delete user data
            with reactive React hooks.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Skills Store</h2>
          <p className="text-gray-600">
            Track skills and competencies. Demonstrates how to work with multiple
            object stores in the same database.
          </p>
        </div>
      </div>
    </div>
  );
}