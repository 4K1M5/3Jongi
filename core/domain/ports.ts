import type { Book, Quiz, QuizProgress, QuizRef, Unit } from './models'

/**
 * Read access to quiz content. A bundled/static implementation backs the
 * GitHub Pages build today; an HTTP implementation can back a real backend
 * later without changing any caller.
 */
export interface ContentRepository {
  listBooks(): Promise<Book[]>
  getBook(bookId: string): Promise<Book | null>
  getUnit(bookId: string, unitId: string): Promise<Unit | null>
  getQuiz(bookId: string, unitId: string, quizId: string): Promise<Quiz | null>
}

/**
 * Persistence for learner progress. A localStorage implementation is used
 * today; a backend/database implementation can replace it behind this same
 * interface.
 */
export interface ProgressRepository {
  getQuizProgress(ref: QuizRef): Promise<QuizProgress | null>
  saveQuizProgress(progress: QuizProgress): Promise<void>
}
