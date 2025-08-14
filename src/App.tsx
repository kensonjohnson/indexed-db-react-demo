import { BrowserRouter, Routes, Route } from 'react-router';
import { DatabaseProvider } from './context/DatabaseContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Users } from './pages/Users';
import { OptimisticUsers } from './pages/OptimisticUsers';
import { Skills } from './pages/Skills';
import { OptimisticSkills } from './pages/OptimisticSkills';
import { UserSkills } from './pages/UserSkills';
import { DataManagement } from './pages/DataManagement';

function App() {
  return (
    <DatabaseProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="users" element={<Users />} />
          <Route path="users-optimistic" element={<OptimisticUsers />} />
          <Route path="skills" element={<Skills />} />
          <Route path="skills-optimistic" element={<OptimisticSkills />} />
          <Route path="user-skills" element={<UserSkills />} />
          <Route path="data-management" element={<DataManagement />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DatabaseProvider>
  );
}

export default App;
