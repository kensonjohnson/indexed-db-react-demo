import { useState, useEffect } from "react";
import { useDatabase } from "../context/DatabaseContext";
import { useSearch } from "../hooks/useSearch";
import { useBulkSelection } from "../hooks/useBulkSelection";
import { BulkActionBar } from "../components/BulkActionBar";
import { Stores } from "../db";
import type { Skill } from "../types";

const skillLevels = ["beginner", "intermediate", "advanced", "expert"] as const;
const skillCategories = [
  "Frontend",
  "Backend",
  "DevOps",
  "Mobile",
  "Database",
  "Design",
];

export function Skills() {
  const {
    isReady,
    initError,
    operationLoading,
    operationError,
    create,
    getAll,
    update,
    remove,
  } = useDatabase();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] =
    useState<Skill["level"]>("beginner");
  const [newSkillCategory, setNewSkillCategory] = useState("Frontend");
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
  const [editSkillName, setEditSkillName] = useState("");
  const [editSkillLevel, setEditSkillLevel] =
    useState<Skill["level"]>("beginner");
  const [editSkillCategory, setEditSkillCategory] = useState("Frontend");

  const {
    searchTerm,
    setSearchTerm,
    filteredData: filteredSkills,
    clearSearch,
    isSearching,
  } = useSearch(skills, ["name", "category", "level"], 300);

  const bulkSelection = useBulkSelection(filteredSkills, "skillId");

  useEffect(() => {
    if (isReady) {
      loadSkills();
    }
  }, [isReady]);

  const loadSkills = async () => {
    const result = await getAll<Skill>(Stores.Skills);
    if (result) {
      setSkills(result);
    }
  };

  const createSkill = async () => {
    if (!newSkillName.trim()) return;

    const skillData: Omit<Skill, "skillId"> = {
      name: newSkillName.trim(),
      level: newSkillLevel,
      category: newSkillCategory,
    };

    const result = await create(Stores.Skills, skillData);
    if (result) {
      setNewSkillName("");
      setNewSkillLevel("beginner");
      setNewSkillCategory("Frontend");
      await loadSkills();
    }
  };

  const deleteSkill = async (skillId: number) => {
    const result = await remove(Stores.Skills, skillId);
    if (result) {
      await loadSkills();
    }
  };

  const startEdit = (skill: Skill) => {
    if (skill.skillId) {
      setEditingSkillId(skill.skillId);
      setEditSkillName(skill.name);
      setEditSkillLevel(skill.level);
      setEditSkillCategory(skill.category);
    }
  };

  const cancelEdit = () => {
    setEditingSkillId(null);
    setEditSkillName("");
    setEditSkillLevel("beginner");
    setEditSkillCategory("Frontend");
  };

  const saveEdit = async () => {
    if (!editingSkillId || !editSkillName.trim()) return;

    const updatedData = {
      name: editSkillName.trim(),
      level: editSkillLevel,
      category: editSkillCategory,
    };

    const createDefault = (): Skill => ({
      name: editSkillName.trim(),
      level: editSkillLevel,
      category: editSkillCategory,
    });

    const result = await update(
      Stores.Skills,
      editingSkillId,
      updatedData,
      createDefault,
    );
    if (result) {
      setEditingSkillId(null);
      setEditSkillName("");
      setEditSkillLevel("beginner");
      setEditSkillCategory("Frontend");
      await loadSkills();
    }
  };

  const bulkDelete = async () => {
    const selectedItems = bulkSelection.selectedItems;
    let successCount = 0;

    for (const skill of selectedItems) {
      if (skill.skillId) {
        const result = await remove(Stores.Skills, skill.skillId);
        if (result) successCount++;
      }
    }

    if (successCount > 0) {
      bulkSelection.clearSelection();
      await loadSkills();
    }

    if (successCount !== selectedItems.length) {
      alert(
        `${successCount} of ${selectedItems.length} skills deleted successfully.`,
      );
    }
  };

  const bulkExport = () => {
    const selectedItems = bulkSelection.selectedItems;
    const dataStr = JSON.stringify(selectedItems, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `skills_export_${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
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
        <h2 className="text-lg font-semibold text-red-800 mb-2">
          Database Error
        </h2>
        <p className="text-red-600">{initError}</p>
      </div>
    );
  }

  const getLevelColor = (level: Skill["level"]) => {
    const colors = {
      beginner: "bg-green-100 text-green-800",
      intermediate: "bg-yellow-100 text-yellow-800",
      advanced: "bg-orange-100 text-orange-800",
      expert: "bg-red-100 text-red-800",
    };
    return colors[level];
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Skills Management
      </h1>

      {/* Create Skill Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Skill</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Skill name"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newSkillLevel}
            onChange={(e) => setNewSkillLevel(e.target.value as Skill["level"])}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {skillLevels.map((level) => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {skillCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <button
            onClick={createSkill}
            disabled={operationLoading || !newSkillName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {operationLoading ? "Adding..." : "Add Skill"}
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

      {/* Skills List */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Skills List</h2>
            {filteredSkills.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={bulkSelection.isAllSelected}
                  ref={(checkbox) => {
                    if (checkbox)
                      checkbox.indeterminate = bulkSelection.isSomeSelected;
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
                placeholder="Search skills..."
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

        {filteredSkills.length === 0 && !operationLoading ? (
          <div className="text-center py-8 text-gray-500">
            {isSearching
              ? `No skills found matching "${searchTerm}"`
              : "No skills found. Add your first skill above!"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill) => (
              <div
                key={skill.skillId}
                className="p-4 border border-gray-200 rounded-lg"
              >
                {editingSkillId === skill.skillId ? (
                  // Edit mode
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editSkillName}
                      onChange={(e) => setEditSkillName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Skill name"
                    />
                    <select
                      value={editSkillLevel}
                      onChange={(e) =>
                        setEditSkillLevel(e.target.value as Skill["level"])
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {skillLevels.map((level) => (
                        <option key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editSkillCategory}
                      onChange={(e) => setEditSkillCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {skillCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={operationLoading || !editSkillName.trim()}
                        className="flex-1 px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {operationLoading ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={operationLoading}
                        className="flex-1 px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={
                            skill.skillId
                              ? bulkSelection.isSelected(skill.skillId)
                              : false
                          }
                          onChange={() =>
                            skill.skillId &&
                            bulkSelection.toggleSelection(skill.skillId)
                          }
                          className="rounded border-gray-300 mt-0.5"
                        />
                        <h3 className="font-medium text-gray-900 truncate">
                          {skill.name}
                        </h3>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => startEdit(skill)}
                          disabled={operationLoading || editingSkillId !== null}
                          className="text-blue-600 hover:text-blue-700 text-base disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed p-1"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() =>
                            skill.skillId && deleteSkill(skill.skillId)
                          }
                          disabled={operationLoading || editingSkillId !== null}
                          className="text-red-600 hover:text-red-700 text-lg font-semibold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed p-1"
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(skill.level)}`}
                      >
                        {skill.level.charAt(0).toUpperCase() +
                          skill.level.slice(1)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {skill.category}
                      </span>
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
