import { Stores } from "../db";
import type { User, Skill, UserSkill } from "../types";

export type DatabaseExport = {
  version: string;
  timestamp: string;
  data: {
    users: User[];
    skills: Skill[];
    userSkills: UserSkill[];
  };
  metadata: {
    totalRecords: number;
    exportedBy: string;
  };
};

export async function exportAllData(
  getAll: <T>(store: any) => Promise<T[] | null>,
): Promise<DatabaseExport> {
  const [users, skills, userSkills] = await Promise.all([
    getAll<User>(Stores.Users),
    getAll<Skill>(Stores.Skills),
    getAll<UserSkill>(Stores.UserSkills),
  ]);

  const exportData: DatabaseExport = {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    data: {
      users: users || [],
      skills: skills || [],
      userSkills: userSkills || [],
    },
    metadata: {
      totalRecords:
        (users?.length || 0) +
        (skills?.length || 0) +
        (userSkills?.length || 0),
      exportedBy: "IndexedDB Demo App",
    },
  };

  return exportData;
}

export function downloadAsJson(data: DatabaseExport, filename?: string) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const defaultFilename = `database_export_${new Date().toISOString().split("T")[0]}.json`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getExportSummary(exportData: DatabaseExport): string {
  const { users, skills, userSkills } = exportData.data;
  const summary = [
    `${users.length} users`,
    `${skills.length} skills`,
    `${userSkills.length} user-skill assignments`,
  ];

  return `Exported ${exportData.metadata.totalRecords} total records (${summary.join(", ")})`;
}
