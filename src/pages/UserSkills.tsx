import { useState, useEffect } from "react";
import { useDatabase } from "../context/DatabaseContext";
import { useSearch } from "../hooks/useSearch";
import { Stores } from "../db";
import type { User, Skill, UserSkill } from "../types";

const proficiencyLevels = [
  "learning",
  "familiar",
  "proficient",
  "expert",
] as const;

export function UserSkills() {
  const {
    isReady,
    initError,
    operationLoading,
    operationError,
    create,
    getAll,
    remove,
  } = useDatabase();
  const [users, setUsers] = useState<User[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null);
  const [proficiencyLevel, setProficiencyLevel] =
    useState<UserSkill["proficiencyLevel"]>("learning");

  // Enhanced UserSkill type for display with user and skill names
  type EnhancedUserSkill = UserSkill & {
    userName: string;
    userEmail: string;
    skillName: string;
    skillCategory: string;
  };

  const [enhancedUserSkills, setEnhancedUserSkills] = useState<
    EnhancedUserSkill[]
  >([]);

  const {
    searchTerm,
    setSearchTerm,
    filteredData: filteredUserSkills,
    clearSearch,
    isSearching,
  } = useSearch(
    enhancedUserSkills,
    ["userName", "userEmail", "skillName", "skillCategory", "proficiencyLevel"],
    300,
  );

  useEffect(() => {
    if (isReady) {
      loadAllData();
    }
  }, [isReady]);

  const loadAllData = async () => {
    const [usersResult, skillsResult, userSkillsResult] = await Promise.all([
      getAll<User>(Stores.Users),
      getAll<Skill>(Stores.Skills),
      getAll<UserSkill>(Stores.UserSkills),
    ]);

    if (usersResult) setUsers(usersResult);
    if (skillsResult) setSkills(skillsResult);
    if (userSkillsResult) setUserSkills(userSkillsResult);
  };

  // Create enhanced user skills with names for display
  useEffect(() => {
    const enhanced: EnhancedUserSkill[] = userSkills.map((userSkill) => {
      const user = users.find((u) => u.userId === userSkill.userId);
      const skill = skills.find((s) => s.skillId === userSkill.skillId);

      return {
        ...userSkill,
        userName: user?.name || "Unknown User",
        userEmail: user?.email || "unknown@email.com",
        skillName: skill?.name || "Unknown Skill",
        skillCategory: skill?.category || "Unknown Category",
      };
    });

    setEnhancedUserSkills(enhanced);
  }, [userSkills, users, skills]);

  const assignSkill = async () => {
    if (!selectedUserId || !selectedSkillId) return;

    // Check if this combination already exists
    const exists = userSkills.some(
      (us) => us.userId === selectedUserId && us.skillId === selectedSkillId,
    );

    if (exists) {
      alert("This user already has this skill assigned!");
      return;
    }

    const userSkillData: Omit<UserSkill, "userSkillId"> = {
      userId: selectedUserId,
      skillId: selectedSkillId,
      proficiencyLevel,
      assignedAt: new Date(),
    };

    const result = await create(Stores.UserSkills, userSkillData);
    if (result) {
      setSelectedUserId(null);
      setSelectedSkillId(null);
      setProficiencyLevel("learning");
      await loadAllData();
    }
  };

  const unassignSkill = async (userSkillId: number) => {
    const result = await remove(Stores.UserSkills, userSkillId);
    if (result) {
      await loadAllData();
    }
  };

  const getProficiencyColor = (level: UserSkill["proficiencyLevel"]) => {
    const colors = {
      learning: "bg-blue-100 text-blue-800",
      familiar: "bg-green-100 text-green-800",
      proficient: "bg-yellow-100 text-yellow-800",
      expert: "bg-red-100 text-red-800",
    };
    return colors[level];
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

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        User Skills Management
      </h1>
      <p className="text-gray-600 mb-6">
        Manage the many-to-many relationship between users and their skills.
      </p>

      {/* Assign Skill Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Assign Skill to User</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={selectedUserId || ""}
            onChange={(e) =>
              setSelectedUserId(e.target.value ? Number(e.target.value) : null)
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select User</option>
            {users.map((user) => (
              <option key={user.userId} value={user.userId}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>

          <select
            value={selectedSkillId || ""}
            onChange={(e) =>
              setSelectedSkillId(e.target.value ? Number(e.target.value) : null)
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Skill</option>
            {skills.map((skill) => (
              <option key={skill.skillId} value={skill.skillId}>
                {skill.name} ({skill.category})
              </option>
            ))}
          </select>

          <select
            value={proficiencyLevel}
            onChange={(e) =>
              setProficiencyLevel(
                e.target.value as UserSkill["proficiencyLevel"],
              )
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {proficiencyLevels.map((level) => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>

          <button
            onClick={assignSkill}
            disabled={operationLoading || !selectedUserId || !selectedSkillId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {operationLoading ? "Assigning..." : "Assign Skill"}
          </button>
        </div>
        {operationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{operationError}</p>
          </div>
        )}
      </div>

      {/* User Skills List */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Assigned Skills</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search assignments..."
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

        {filteredUserSkills.length === 0 && !operationLoading ? (
          <div className="text-center py-8 text-gray-500">
            {isSearching
              ? `No assignments found matching "${searchTerm}"`
              : "No skills assigned yet. Assign some skills above!"}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUserSkills.map((userSkill) => (
              <div
                key={userSkill.userSkillId}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-gray-900">
                      {userSkill.userName}
                    </h3>
                    <span className="text-sm text-gray-500">→</span>
                    <span className="font-medium text-blue-900">
                      {userSkill.skillName}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({userSkill.skillCategory})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-600">{userSkill.userEmail}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getProficiencyColor(userSkill.proficiencyLevel)}`}
                    >
                      {userSkill.proficiencyLevel.charAt(0).toUpperCase() +
                        userSkill.proficiencyLevel.slice(1)}
                    </span>
                    <span className="text-gray-400">
                      Assigned:{" "}
                      {new Date(userSkill.assignedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    userSkill.userSkillId &&
                    unassignSkill(userSkill.userSkillId)
                  }
                  disabled={operationLoading}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Unassign
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
