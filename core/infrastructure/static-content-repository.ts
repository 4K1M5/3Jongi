import type { Book, Quiz, Unit } from '../domain/models'
import type { ContentRepository } from '../domain/ports'

/** Serves quiz content from an in-memory, bundled list — the static-build source. */
export class StaticContentRepository implements ContentRepository {
  constructor(private readonly books: readonly Book[]) {}

  listBooks(): Promise<Book[]> {
    return Promise.resolve([...this.books])
  }

  getBook(bookId: string): Promise<Book | null> {
    return Promise.resolve(this.findBook(bookId))
  }

  getUnit(bookId: string, unitId: string): Promise<Unit | null> {
    return Promise.resolve(this.findUnit(bookId, unitId))
  }

  getQuiz(bookId: string, unitId: string, quizId: string): Promise<Quiz | null> {
    const unit = this.findUnit(bookId, unitId)
    return Promise.resolve(unit?.quizzes.find((quiz) => quiz.id === quizId) ?? null)
  }

  private findBook(bookId: string): Book | null {
    return this.books.find((book) => book.id === bookId) ?? null
  }

  private findUnit(bookId: string, unitId: string): Unit | null {
    const book = this.findBook(bookId)
    return book?.units.find((unit) => unit.id === unitId) ?? null
  }
}
