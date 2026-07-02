import type { CurriculumData, Day, Lesson, Exercise } from './types';
import raw from './curriculum.json';

export const curriculumData = raw as unknown as CurriculumData;
export const curriculum: Day[] = curriculumData.curriculum;
export const cheatSheet = curriculumData.cheatSheet;

export function getAllLessons(): Lesson[] {
  return curriculum.flatMap(d => d.lessons ?? []);
}

export function getAllExercises(): Exercise[] {
  return curriculum.flatMap(d => d.exercises ?? []);
}

export function getLesson(id: string): Lesson | undefined {
  return getAllLessons().find(l => l.id === id);
}

export function getExercise(id: string): Exercise | undefined {
  return getAllExercises().find(e => e.id === id);
}
