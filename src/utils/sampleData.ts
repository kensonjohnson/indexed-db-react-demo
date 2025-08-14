import type { User, Skill } from '../types';

const sampleUsers: Omit<User, 'userId'>[] = [
  {
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    createdAt: new Date('2024-01-15'),
  },
  {
    name: 'Bob Smith',
    email: 'bob.smith@example.com',
    createdAt: new Date('2024-02-10'),
  },
  {
    name: 'Carol Davis',
    email: 'carol.davis@example.com',
    createdAt: new Date('2024-02-28'),
  },
  {
    name: 'David Wilson',
    email: 'david.wilson@example.com',
    createdAt: new Date('2024-03-05'),
  },
  {
    name: 'Eva Brown',
    email: 'eva.brown@example.com',
    createdAt: new Date('2024-03-12'),
  },
  {
    name: 'Frank Miller',
    email: 'frank.miller@example.com',
    createdAt: new Date('2024-03-20'),
  },
  {
    name: 'Grace Chen',
    email: 'grace.chen@example.com',
    createdAt: new Date('2024-04-02'),
  },
  {
    name: 'Henry Taylor',
    email: 'henry.taylor@example.com',
    createdAt: new Date('2024-04-08'),
  },
];

const sampleSkills: Omit<Skill, 'skillId'>[] = [
  { name: 'React', level: 'advanced', category: 'Frontend' },
  { name: 'TypeScript', level: 'intermediate', category: 'Frontend' },
  { name: 'JavaScript', level: 'expert', category: 'Frontend' },
  { name: 'Node.js', level: 'advanced', category: 'Backend' },
  { name: 'Python', level: 'intermediate', category: 'Backend' },
  { name: 'PostgreSQL', level: 'intermediate', category: 'Database' },
  { name: 'MongoDB', level: 'beginner', category: 'Database' },
  { name: 'Docker', level: 'intermediate', category: 'DevOps' },
  { name: 'Kubernetes', level: 'beginner', category: 'DevOps' },
  { name: 'AWS', level: 'intermediate', category: 'DevOps' },
  { name: 'Vue.js', level: 'beginner', category: 'Frontend' },
  { name: 'GraphQL', level: 'intermediate', category: 'Backend' },
  { name: 'Redis', level: 'beginner', category: 'Database' },
  { name: 'Figma', level: 'intermediate', category: 'Design' },
  { name: 'Photoshop', level: 'advanced', category: 'Design' },
  { name: 'Flutter', level: 'beginner', category: 'Mobile' },
  { name: 'React Native', level: 'intermediate', category: 'Mobile' },
  { name: 'Swift', level: 'beginner', category: 'Mobile' },
];

export { sampleUsers, sampleSkills };