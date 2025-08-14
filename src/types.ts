export type User = {
  userId?: number;
  name: string;
  email: string;
  createdAt: Date;
};

export type Skill = {
  skillId?: number;
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  category: string;
};

export type UserSkill = {
  userSkillId?: number;
  userId: number;
  skillId: number;
  proficiencyLevel: "learning" | "familiar" | "proficient" | "expert";
  assignedAt: Date;
};
