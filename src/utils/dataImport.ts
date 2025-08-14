import type { DatabaseExport } from './dataExport';
import type { User, Skill } from '../types';

export type ImportResult = {
  success: boolean;
  message: string;
  errors: string[];
  imported: {
    users: number;
    skills: number;
    userSkills: number;
  };
  skipped: {
    users: number;
    skills: number;
    userSkills: number;
  };
};

export type ImportOptions = {
  skipDuplicates: boolean;
  createBackup: boolean;
  validateData: boolean;
};

export function validateImportData(data: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Invalid file format: must be a valid JSON object');
    return { isValid: false, errors };
  }

  const importData = data as Partial<DatabaseExport>;

  // Check required structure
  if (!importData.version) {
    errors.push('Missing version information');
  }

  if (!importData.data) {
    errors.push('Missing data section');
    return { isValid: false, errors };
  }

  // Validate data arrays
  const { users, skills, userSkills } = importData.data;

  if (!Array.isArray(users)) {
    errors.push('Users data must be an array');
  } else {
    users.forEach((user, index) => {
      if (!user.name || !user.email) {
        errors.push(`User at index ${index}: missing name or email`);
      }
    });
  }

  if (!Array.isArray(skills)) {
    errors.push('Skills data must be an array');
  } else {
    skills.forEach((skill, index) => {
      if (!skill.name || !skill.category || !skill.level) {
        errors.push(`Skill at index ${index}: missing name, category, or level`);
      }
    });
  }

  if (!Array.isArray(userSkills)) {
    errors.push('UserSkills data must be an array');
  } else {
    userSkills.forEach((userSkill, index) => {
      if (!userSkill.userId || !userSkill.skillId || !userSkill.proficiencyLevel) {
        errors.push(`UserSkill at index ${index}: missing userId, skillId, or proficiencyLevel`);
      }
    });
  }

  return { isValid: errors.length === 0, errors };
}

export async function importData(
  importData: DatabaseExport,
  options: ImportOptions,
  databaseOperations: {
    getAll: <T>(store: any) => Promise<T[] | null>;
    create: <T>(store: any, data: T) => Promise<number | null>;
    clearStore: (store: any) => Promise<boolean | null>;
  }
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    message: '',
    errors: [],
    imported: { users: 0, skills: 0, userSkills: 0 },
    skipped: { users: 0, skills: 0, userSkills: 0 },
  };

  try {
    // Validate data if requested
    if (options.validateData) {
      const validation = validateImportData(importData);
      if (!validation.isValid) {
        result.errors = validation.errors;
        result.message = 'Validation failed';
        return result;
      }
    }

    // Get existing data to check for duplicates
    const [existingUsers, existingSkills] = await Promise.all([
      databaseOperations.getAll<User>('users'),
      databaseOperations.getAll<Skill>('skills'),
    ]);

    // Import users
    for (const user of importData.data.users) {
      const isDuplicate = existingUsers?.some(existing => 
        existing.email === user.email
      );

      if (isDuplicate && options.skipDuplicates) {
        result.skipped.users++;
        continue;
      }

      // Remove ID to let database auto-generate
      const userData = { ...user };
      delete userData.userId;

      const newId = await databaseOperations.create('users', userData);
      if (newId) {
        result.imported.users++;
      }
    }

    // Import skills
    for (const skill of importData.data.skills) {
      const isDuplicate = existingSkills?.some(existing => 
        existing.name === skill.name && existing.category === skill.category
      );

      if (isDuplicate && options.skipDuplicates) {
        result.skipped.skills++;
        continue;
      }

      // Remove ID to let database auto-generate  
      const skillData = { ...skill };
      delete skillData.skillId;

      const newId = await databaseOperations.create('skills', skillData);
      if (newId) {
        result.imported.skills++;
      }
    }

    // Import user skills (skip for now as it requires ID mapping)
    // This would need more complex logic to map old IDs to new IDs
    result.message = `Successfully imported ${result.imported.users} users and ${result.imported.skills} skills`;
    result.success = true;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown import error');
    result.message = 'Import failed due to errors';
  }

  return result;
}

export function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const data = JSON.parse(result);
          resolve(data);
        } else {
          reject(new Error('Failed to read file content'));
        }
      } catch (error) {
        reject(new Error('Invalid JSON format'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}