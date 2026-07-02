export interface CodeExample {
  caption?: string;
  code: string;
  explanation?: string;
}

export interface LessonSection {
  heading: string;
  body: string;
  codeExample?: CodeExample;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  sections: LessonSection[];
  practicePrompt?: string;
  practiceStarterCode?: string;
  practiceHint?: string;
  practiceSolution?: string;
}

export interface TestCase {
  description: string;
  input: string;
  expectedOutput: string;
}

export interface ExerciseLevel {
  level: number;
  title: string;
  description: string;
  instructions: string;
  requirements: string[];
  baseClass: string;
  starterCode: string;
  testCases: TestCase[];
  hint?: string;
  solution?: string;
  timeGuidanceMinutes?: number;
  testFileContent?: string;
}

export interface Exercise {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  archetype?: string;
  totalLevels?: number;
  implStarterCode?: string;
  levels: ExerciseLevel[];
}

export interface Day {
  number: number;
  title: string;
  subtitle?: string;
  theme?: string;
  lessons: Lesson[];
  exercises: Exercise[];
}

export interface CheatSheetItem {
  label: string;
  code: string;
  note?: string;
}

export interface CheatSheetSection {
  title: string;
  items: CheatSheetItem[];
}

export interface CurriculumData {
  curriculum: Day[];
  cheatSheet: { sections: CheatSheetSection[] };
}
