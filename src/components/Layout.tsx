import { Outlet, NavLink } from "react-router";

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  IndexedDB Demo
                </h1>
              </div>
              <div className="ml-10 flex items-center space-x-4">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  Home
                </NavLink>
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  Users
                </NavLink>
                <NavLink
                  to="/users-optimistic"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  Users ⚡
                </NavLink>
                <NavLink
                  to="/skills"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  Skills
                </NavLink>
                <NavLink
                  to="/skills-optimistic"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  Skills ⚡
                </NavLink>
                <NavLink
                  to="/user-skills"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  User Skills
                </NavLink>
                <NavLink
                  to="/data-management"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  Data Management
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
