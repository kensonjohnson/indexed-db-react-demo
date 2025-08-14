import { useState, useEffect } from "react";
import { useOptimisticUpdate } from "../hooks/useOptimisticUpdate";
import { useSearch } from "../hooks/useSearch";
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

export function OptimisticSkills() {
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

  const optimistic = useOptimisticUpdate<Skill>(Stores.Skills, "skillId");
  const { database } = optimistic;

  const {
    searchTerm,
    setSearchTerm,
    filteredData: filteredSkills,
    clearSearch,
    isSearching,
  } = useSearch(skills, ["name", "category", "level"], 300);

  useEffect(() => {
    if (database.isReady) {
      loadSkills();
    }
  }, [database.isReady]);

  const loadSkills = async () => {
    const result = await database.getAll<Skill>(Stores.Skills);
    if (result) {
      setSkills(result);
    }
  };

  // OPTIMISTIC CREATE - Skill appears immediately in the grid
  const createSkill = async () => {
    if (!newSkillName.trim()) return;

    const skillData = {
      name: newSkillName.trim(),
      level: newSkillLevel,
      category: newSkillCategory,
    };

    // Clear form immediately (optimistic UX)
    setNewSkillName("");
    setNewSkillLevel("beginner");
    setNewSkillCategory("Frontend");

    const result = await optimistic.optimisticCreate(skillData);

    if (result.success) {
      // Add optimistic item to local state immediately
      if (result.item) {
        setSkills((prev) => [...prev, result.item as Skill]);
      }

      // Clean up the operation after a delay
      setTimeout(() => {
        optimistic.clearOperation(result.operationId);
        // Reload to get the real data with actual ID
        loadSkills();
      }, 2000);
    } else {
      // Rollback form state on error
      setNewSkillName(skillData.name);
      setNewSkillLevel(skillData.level);
      setNewSkillCategory(skillData.category);
      alert(`Failed to create skill: ${result.error}`);
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

  // OPTIMISTIC UPDATE - Changes show instantly in the card
  const saveEdit = async () => {
    if (!editingSkillId || !editSkillName.trim()) return;

    const originalSkill = skills.find((s) => s.skillId === editingSkillId);
    if (!originalSkill) return;

    const updates = {
      name: editSkillName.trim(),
      level: editSkillLevel,
      category: editSkillCategory,
    };

    const createDefault = (): Skill => ({
      name: editSkillName.trim(),
      level: editSkillLevel,
      category: editSkillCategory,
    });

    // Update local state immediately (optimistic)
    setSkills((prev) =>
      prev.map((skill) =>
        skill.skillId === editingSkillId ? { ...skill, ...updates } : skill,
      ),
    );

    // Clear editing state immediately (optimistic UX)
    setEditingSkillId(null);
    setEditSkillName("");
    setEditSkillLevel("beginner");
    setEditSkillCategory("Frontend");

    const result = await optimistic.optimisticUpdate(
      editingSkillId,
      updates,
      originalSkill,
      createDefault,
    );

    if (result.success) {
      // Update with confirmed data
      if (result.item) {
        setSkills((prev) =>
          prev.map((skill) =>
            skill.skillId === editingSkillId ? (result.item as Skill) : skill,
          ),
        );
      }

      // Clean up the operation
      setTimeout(() => {
        optimistic.clearOperation(result.operationId);
      }, 1000);
    } else {
      // Rollback on error
      setSkills((prev) =>
        prev.map((skill) =>
          skill.skillId === editingSkillId ? originalSkill : skill,
        ),
      );

      // Restore editing state for retry
      setEditingSkillId(editingSkillId);
      setEditSkillName(originalSkill.name);
      setEditSkillLevel(originalSkill.level);
      setEditSkillCategory(originalSkill.category);

      alert(`Failed to update skill: ${result.error}`);
    }
  };

  // OPTIMISTIC DELETE - Card disappears immediately from grid
  const deleteSkill = async (skillId: number) => {
    const skillToDelete = skills.find((s) => s.skillId === skillId);
    if (!skillToDelete) return;

    // Remove from local state immediately (optimistic)
    setSkills((prev) => prev.filter((skill) => skill.skillId !== skillId));

    const result = await optimistic.optimisticDelete(skillId, skillToDelete);

    if (result.success) {
      // Clean up the operation
      setTimeout(() => {
        optimistic.clearOperation(result.operationId);
      }, 1000);
    } else {
      // Rollback - restore the skill to the list
      setSkills((prev) =>
        [...prev, skillToDelete].sort(
          (a, b) => (a.skillId || 0) - (b.skillId || 0),
        ),
      );

      alert(`Failed to delete skill: ${result.error}`);
    }
  };

  const getLevelColor = (level: Skill["level"]) => {
    const colors = {
      beginner: "bg-green-100 text-green-800",
      intermediate: "bg-yellow-100 text-yellow-800",
      advanced: "bg-orange-100 text-orange-800",
      expert: "bg-red-100 text-red-800",
    };
    return colors[level];
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
        <h2 className="text-lg font-semibold text-red-800 mb-2">
          Database Error
        </h2>
        <p className="text-red-600">{database.initError}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Skills Management (Optimistic Updates)
        </h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            ⚡ Optimistic Update Pattern
          </h3>
          <p className="text-blue-700 text-sm">
            This demonstrates <strong>optimistic updates</strong> in a
            card-based layout: skills appear/disappear instantly, edits show
            immediately, and the UI automatically rolls back if database
            operations fail. Notice the difference in responsiveness compared to
            the traditional Skills page.
          </p>
        </div>
      </div>

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
            disabled={!newSkillName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Skill (Instant)
          </button>
        </div>
        {database.operationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{database.operationError}</p>
          </div>
        )}
      </div>

      {/* Skills List */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Skills List</h2>
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

        {filteredSkills.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {isSearching
              ? `No skills found matching "${searchTerm}"`
              : "No skills found. Add your first skill above!"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill) => {
              const optimisticState = optimistic.getOptimisticState(
                skill.skillId,
              );

              return (
                <div
                  key={skill.skillId}
                  className="p-4 border border-gray-200 rounded-lg relative"
                >
                  {/* Optimistic State Indicator */}
                  {optimisticState && (
                    <div className="absolute top-2 right-2 z-10">
                      {optimisticState.isPending && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⏳
                        </span>
                      )}
                      {optimisticState.isConfirmed && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅
                        </span>
                      )}
                      {optimisticState.isError && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ❌
                        </span>
                      )}
                    </div>
                  )}

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
                          disabled={!editSkillName.trim()}
                          className="flex-1 px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          Save (Instant)
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900 flex-1 min-w-0 truncate pr-2">
                          {skill.name}
                        </h3>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => startEdit(skill)}
                            disabled={editingSkillId !== null}
                            className="text-blue-600 hover:text-blue-700 text-base disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed p-1"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() =>
                              skill.skillId && deleteSkill(skill.skillId)
                            }
                            disabled={editingSkillId !== null}
                            className="text-red-600 hover:text-red-700 text-lg font-semibold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed p-1"
                            title="Delete (Instant)"
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
