# IndexedDB React Demo

A comprehensive learning resource and production-ready reference implementation for building React applications with IndexedDB. This project demonstrates everything from basic CRUD operations to advanced patterns like optimistic updates and bulk operations.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![IndexedDB](https://img.shields.io/badge/IndexedDB-Browser%20API-ff6b35)
![React Router](https://img.shields.io/badge/React%20Router-7-ca4245?logo=react-router)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?logo=tailwind-css)

## 🎯 What You'll Learn

This project serves as a **complete educational resource** for IndexedDB in React, showing you:

- **Traditional vs Optimistic Update Patterns** - Side-by-side implementations
- **Complex Data Relationships** - Many-to-many with junction tables
- **Advanced UI Patterns** - Search, bulk operations, data export/import
- **Production-Ready Architecture** - Custom hooks, context providers, error handling
- **TypeScript Best Practices** - Full type safety throughout the IndexedDB layer

## 🚀 Features

### Core Functionality
- ✅ **Complete CRUD Operations** - Create, Read, Update, Delete
- ✅ **Real-time Search** - Debounced search across multiple fields
- ✅ **Inline Editing** - Edit records directly in the interface
- ✅ **Bulk Operations** - Select multiple items for batch operations
- ✅ **Data Relationships** - User-Skills many-to-many relationships
- ✅ **Data Management** - Full export/import with validation

### Educational Patterns
- 🎓 **Traditional Updates** - Standard database-first patterns (`Users.tsx`, `Skills.tsx`)
- ⚡ **Optimistic Updates** - Instant UI updates with rollback (`OptimisticUsers.tsx`, `OptimisticSkills.tsx`)
- 🔍 **Pattern Comparison** - See both approaches in the same codebase
- 📚 **Code-as-Documentation** - Learn through real, working examples

### Technical Highlights
- 🏗️ **Database Schema Design** - Proper indices and relationships
- 🔄 **Schema Migrations** - Database versioning and upgrades
- 🎣 **Custom Hooks** - Reusable logic for database operations
- 🏪 **Context Architecture** - Clean state management patterns
- 🛡️ **Type Safety** - Full TypeScript coverage for database operations

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Learning Path](#learning-path)
- [Key Patterns](#key-patterns)
- [API Reference](#api-reference)
- [Implementation Details](#implementation-details)
- [Contributing](#contributing)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd indexed-db-react-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Populate sample data**
   - Navigate to the home page
   - Click "Populate Sample Data" to get started with example records
   - Explore different pages to see various patterns in action

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── BulkActionBar.tsx    # Bulk operations interface
│   └── Layout.tsx           # Navigation and app shell
├── context/              # React Context providers
│   └── DatabaseContext.tsx # Database state management
├── hooks/                # Custom React hooks
│   ├── useBulkSelection.ts  # Multi-select functionality
│   ├── useOptimisticUpdate.ts # Optimistic update patterns
│   └── useSearch.ts         # Debounced search logic
├── pages/                # Route components
│   ├── Users.tsx            # Traditional CRUD pattern
│   ├── OptimisticUsers.tsx  # Optimistic update pattern
│   ├── Skills.tsx           # Traditional skills management
│   ├── OptimisticSkills.tsx # Optimistic skills management
│   ├── UserSkills.tsx       # Many-to-many relationships
│   ├── DataManagement.tsx   # Export/import functionality
│   └── Home.tsx             # Landing page with quick start
├── utils/                # Utility functions
│   ├── dataExport.ts        # Database export logic
│   ├── dataImport.ts        # Database import with validation
│   └── sampleData.ts        # Sample data generation
├── db.ts                 # Core IndexedDB operations
└── types.ts              # TypeScript type definitions
```

## 🎓 Learning Path

### 1. Start with Basics
- **Home Page** - Understand the project overview
- **`src/db.ts`** - Core IndexedDB operations and database setup
- **Traditional Users** (`src/pages/Users.tsx`) - Standard CRUD patterns

### 2. Explore Advanced Patterns  
- **Search Functionality** - See debounced search implementation
- **Bulk Operations** - Multi-select and batch operations
- **Data Relationships** - Many-to-many with UserSkills

### 3. Compare Update Patterns
- **Traditional**: `Users.tsx` vs **Optimistic**: `OptimisticUsers.tsx`
- **Traditional**: `Skills.tsx` vs **Optimistic**: `OptimisticSkills.tsx`
- Notice the UX differences and implementation complexity

### 4. Advanced Features
- **Data Management** - Export/import with validation
- **Schema Migrations** - Database versioning in `db.ts`
- **Custom Hooks** - Reusable patterns in `hooks/`

## 🔑 Key Patterns

### Traditional Update Pattern
```typescript
// Traditional: Wait for database, then update UI
const updateUser = async (id, data) => {
  setLoading(true);
  const result = await database.update(store, id, data);
  if (result) {
    await refreshData(); // Reload from database
  }
  setLoading(false);
};
```

### Optimistic Update Pattern
```typescript
// Optimistic: Update UI immediately, then sync with database
const optimisticUpdate = async (id, data, original) => {
  // 1. Update UI immediately
  updateLocalState(data);
  
  // 2. Sync with database
  const result = await database.update(store, id, data);
  
  // 3. Rollback on failure
  if (!result.success) {
    updateLocalState(original); // Revert changes
  }
};
```

### Database Context Pattern
```typescript
// Single hook providing all database functionality
const { 
  isReady,           // Database initialization state
  operationLoading,  // Current operation status
  create,           // Create new records
  getAll,           // Fetch all records
  update,           // Update existing records
  remove,           // Delete records
  clearStore        // Bulk delete operations
} = useDatabase();
```

## 📖 API Reference

### Core Database Operations

| Function | Description | Returns |
|----------|-------------|---------|
| `initDB()` | Initialize IndexedDB with schema | `Promise<boolean>` |
| `create(store, data)` | Create new record | `Promise<number \| null>` |
| `get(store, id)` | Get single record by ID | `Promise<T \| null>` |
| `getAll(store)` | Get all records from store | `Promise<T[] \| null>` |
| `update(store, id, data, createDefault)` | Update existing record | `Promise<T \| null>` |
| `remove(store, id)` | Delete record by ID | `Promise<boolean>` |
| `clearStore(store)` | Delete all records | `Promise<boolean>` |

### Database Stores

| Store | Purpose | Key Field | Indices |
|-------|---------|-----------|---------|
| `users` | User management | `userId` | Auto-increment |
| `skills` | Skills catalog | `skillId` | Auto-increment |
| `userSkills` | User-skill relationships | `userSkillId` | `userId`, `skillId`, composite |

### Custom Hooks

| Hook | Purpose | Key Features |
|------|---------|--------------|
| `useDatabase()` | Database operations | Context provider, loading states |
| `useSearch(data, fields)` | Real-time search | Debouncing, multi-field search |
| `useBulkSelection(data, keyField)` | Multi-select | Select all/none, bulk operations |
| `useOptimisticUpdate(store, keyField)` | Optimistic updates | Instant UI, rollback on failure |

## 🛠️ Implementation Details

### Database Schema
- **Version 3** - Current schema with all stores
- **Auto-incrementing keys** - Managed by IndexedDB
- **Composite indices** - For efficient relationship queries
- **Migration support** - Automatic schema upgrades

### Error Handling
- **Global error handler** - Database-level error catching
- **Operation-level errors** - Granular error reporting  
- **User feedback** - Clear error messages in UI
- **Graceful degradation** - App works even with database issues

### Performance Optimizations
- **Debounced search** - Prevents excessive filtering
- **Efficient indices** - Fast lookups for relationships
- **Transaction management** - Optimal database operations
- **Memory management** - Proper cleanup of operations

### TypeScript Integration
- **Full type safety** - From database to UI components
- **Strict mode enabled** - Catches type issues early
- **Generic functions** - Type-safe database operations
- **Discriminated unions** - Type-safe state management

## 🏗️ Build and Deploy

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality
```

### Production Considerations
- **Database migrations** - Handle schema changes gracefully
- **Error boundaries** - Catch and handle React errors
- **Performance monitoring** - Track database operation times
- **Browser compatibility** - IndexedDB support across browsers

## 🤝 Contributing

This project is designed as a learning resource. Contributions that improve the educational value are welcome:

- **New patterns** - Additional database patterns or React techniques
- **Documentation** - Improved explanations or examples
- **Bug fixes** - Corrections to existing implementations
- **Performance** - Optimizations that don't compromise readability

## 📚 Additional Resources

- [IndexedDB API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [React Router v7 Guide](https://reactrouter.com/start/declarative/installation)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ as a learning resource for the React and IndexedDB community.**
```
