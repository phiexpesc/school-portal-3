// Local in-memory data store for when Firebase is unavailable
import type { Book, User, Event, Testimonial, Announcement, Enrollment, Grade, Message, Ticket, ProfileSettings, Section, AttendanceSession, AttendanceRecord } from '@/types';

// Local storage keys
const STORAGE_KEYS = {
  BOOKS: 'sp_books',
  USERS: 'sp_users',
  EVENTS: 'sp_events',
  TESTIMONIALS: 'sp_testimonials',
  ANNOUNCEMENTS: 'sp_announcements',
  ENROLLMENTS: 'sp_enrollments',
  GRADES: 'sp_grades',
  MESSAGES: 'sp_messages',
  TICKETS: 'sp_tickets',
  PROFILE_SETTINGS: 'sp_profileSettings',
  SECTIONS: 'sp_sections',
  ATTENDANCE_SESSIONS: 'sp_attendanceSessions',
  ATTENDANCE_RECORDS: 'sp_attendanceRecords',
};

// Default data
const defaultBooks: Book[] = [
  {
    id: 'book-1',
    title: 'The Secret Garden',
    author: 'Frances Hodgson Burnett',
    description: 'A classic tale of curiosity, nature, and friendship—perfect for grades 5–8.',
    genre: 'Classic',
    grade: '5-8',
    pages: 320,
    available: 3,
    total: 5,
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop'
  },
  {
    id: 'book-2',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    description: 'Explore the mysteries of the universe, from black holes to the Big Bang.',
    genre: 'Science',
    grade: '9-12',
    pages: 256,
    available: 2,
    total: 4,
    coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop'
  },
  {
    id: 'book-3',
    title: 'Coding for Kids',
    author: 'Sarah Johnson',
    description: 'Learn programming fundamentals with fun projects and games.',
    genre: 'Coding',
    grade: '3-8',
    pages: 180,
    available: 5,
    total: 6,
    coverUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=600&fit=crop'
  },
  {
    id: 'book-4',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    description: 'A masterpiece of American literature set in the Jazz Age.',
    genre: 'Fiction',
    grade: '9-12',
    pages: 180,
    available: 4,
    total: 6,
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop'
  },
  {
    id: 'book-5',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    description: 'A brief history of humankind, from ancient ancestors to modern society.',
    genre: 'History',
    grade: '9-12',
    pages: 443,
    available: 3,
    total: 5,
    coverUrl: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop'
  },
  {
    id: 'book-6',
    title: "Charlotte's Web",
    author: 'E.B. White',
    description: 'A heartwarming story of friendship between a pig and a spider.',
    genre: 'Fiction',
    grade: '3-6',
    pages: 192,
    available: 6,
    total: 8,
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop'
  }
];

const defaultEvents: Event[] = [
  {
    id: 'event-1',
    title: 'Science Fair Prep',
    date: 'Tuesday',
    time: '3:30 PM',
    description: 'Get help with your science fair project and meet mentors.',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=250&fit=crop'
  },
  {
    id: 'event-2',
    title: 'Creative Writing Club',
    date: 'Wednesday',
    time: '4:00 PM',
    description: 'Share your stories and learn new writing techniques.',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=250&fit=crop'
  },
  {
    id: 'event-3',
    title: 'Library Orientation',
    date: 'Friday',
    time: '2:00 PM',
    description: 'Learn how to use the library resources effectively.',
    imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=250&fit=crop'
  }
];

const defaultTestimonials: Testimonial[] = [
  { id: 'test-1', quote: 'The library search makes everything faster.', author: 'Maya', grade: '7th grade' },
  { id: 'test-2', quote: 'I never miss a return date now.', author: 'Leo', grade: '6th grade' },
  { id: 'test-3', quote: 'Subjects page helps me plan my week.', author: 'Sara', grade: '8th grade' }
];

const defaultAnnouncements: Announcement[] = [];

const defaultUsers: (User & { password?: string })[] = [
  {
    id: 'user-admin',
    name: 'Admin',
    email: 'admin@schoolportal.edu',
    password: 'admin',
    role: 'admin',
    borrowedBooks: [],
    verified: true,
    verificationPending: false
  }
];

const defaultEnrollments: Enrollment[] = [];
const defaultGrades: Grade[] = [];
const defaultMessages: Message[] = [];
const defaultTickets: Ticket[] = [];
const defaultProfileSettings: ProfileSettings = { supportEmail: 'atggoal@gmail.com' };
const defaultSections: Section[] = [];
const defaultAttendanceSessions: AttendanceSession[] = [];
const defaultAttendanceRecords: AttendanceRecord[] = [];

// Helper to get data from localStorage or use default
function getLocalData<T>(key: string, defaultData: T[]): T[] {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn(`Error reading ${key} from localStorage:`, error);
  }
  // Initialize with default data
  localStorage.setItem(key, JSON.stringify(defaultData));
  return defaultData;
}

// Helper to save data to localStorage
function saveLocalData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Error saving ${key} to localStorage:`, error);
  }
}

// Local Data Store
class LocalDataStore {
  // Books
  getBooks(): Book[] {
    return getLocalData(STORAGE_KEYS.BOOKS, defaultBooks);
  }

  saveBooks(books: Book[]): void {
    saveLocalData(STORAGE_KEYS.BOOKS, books);
  }

  addBook(book: Book): void {
    const books = this.getBooks();
    books.push(book);
    this.saveBooks(books);
  }

  updateBook(id: string, updates: Partial<Book>): void {
    const books = this.getBooks();
    const index = books.findIndex(b => b.id === id);
    if (index !== -1) {
      books[index] = { ...books[index], ...updates };
      this.saveBooks(books);
    }
  }

  deleteBook(id: string): void {
    const books = this.getBooks();
    const filtered = books.filter(b => b.id !== id);
    this.saveBooks(filtered);
  }

  // Users
  getUsers(): (User & { password?: string })[] {
    return getLocalData(STORAGE_KEYS.USERS, defaultUsers);
  }

  saveUsers(users: (User & { password?: string })[]): void {
    saveLocalData(STORAGE_KEYS.USERS, users);
  }

  getUserByEmail(email: string): (User & { password?: string }) | null {
    const users = this.getUsers();
    return users.find(u => u.email === email) || null;
  }

  getUserById(id: string): (User & { password?: string }) | null {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  addUser(user: User & { password?: string }): void {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  }

  updateUser(id: string, updates: Partial<User>): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      this.saveUsers(users);
    }
  }

  deleteUser(id: string): void {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    this.saveUsers(filtered);
  }

  getPendingVerifications(): User[] {
    const users = this.getUsers();
    return users
      .filter(u => u.verificationPending)
      .map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword as User;
      });
  }

  // Events
  getEvents(): Event[] {
    return getLocalData(STORAGE_KEYS.EVENTS, defaultEvents);
  }

  saveEvents(events: Event[]): void {
    saveLocalData(STORAGE_KEYS.EVENTS, events);
  }

  addEvent(event: Event): void {
    const events = this.getEvents();
    events.push(event);
    this.saveEvents(events);
  }

  updateEvent(id: string, updates: Partial<Event>): void {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index !== -1) {
      events[index] = { ...events[index], ...updates };
      this.saveEvents(events);
    }
  }

  deleteEvent(id: string): void {
    const events = this.getEvents();
    const filtered = events.filter(e => e.id !== id);
    this.saveEvents(filtered);
  }

  // Testimonials
  getTestimonials(): Testimonial[] {
    return getLocalData(STORAGE_KEYS.TESTIMONIALS, defaultTestimonials);
  }

  // Announcements
  getAnnouncements(): Announcement[] {
    return getLocalData(STORAGE_KEYS.ANNOUNCEMENTS, defaultAnnouncements);
  }

  saveAnnouncements(announcements: Announcement[]): void {
    saveLocalData(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
  }

  addAnnouncement(announcement: Announcement): void {
    const announcements = this.getAnnouncements();
    announcements.push(announcement);
    this.saveAnnouncements(announcements);
  }

  updateAnnouncement(id: string, updates: Partial<Announcement>): void {
    const announcements = this.getAnnouncements();
    const index = announcements.findIndex(a => a.id === id);
    if (index !== -1) {
      announcements[index] = { ...announcements[index], ...updates };
      this.saveAnnouncements(announcements);
    }
  }

  deleteAnnouncement(id: string): void {
    const announcements = this.getAnnouncements();
    const filtered = announcements.filter(a => a.id !== id);
    this.saveAnnouncements(filtered);
  }

  // Enrollments
  getEnrollments(): Enrollment[] {
    return getLocalData(STORAGE_KEYS.ENROLLMENTS, defaultEnrollments);
  }

  saveEnrollments(enrollments: Enrollment[]): void {
    saveLocalData(STORAGE_KEYS.ENROLLMENTS, enrollments);
  }

  addEnrollment(enrollment: Enrollment): void {
    const enrollments = this.getEnrollments();
    enrollments.push(enrollment);
    this.saveEnrollments(enrollments);
  }

  updateEnrollment(id: string, updates: Partial<Enrollment>): void {
    const enrollments = this.getEnrollments();
    const index = enrollments.findIndex(e => e.id === id);
    if (index !== -1) {
      enrollments[index] = { ...enrollments[index], ...updates };
      this.saveEnrollments(enrollments);
    }
  }

  // Grades
  getGrades(): Grade[] {
    return getLocalData(STORAGE_KEYS.GRADES, defaultGrades);
  }

  saveGrades(grades: Grade[]): void {
    saveLocalData(STORAGE_KEYS.GRADES, grades);
  }

  addGrade(grade: Grade): void {
    const grades = this.getGrades();
    grades.push(grade);
    this.saveGrades(grades);
  }

  deleteGrade(id: string): void {
    const grades = this.getGrades();
    const filtered = grades.filter(g => g.id !== id);
    this.saveGrades(filtered);
  }

  // Messages
  getMessages(): Message[] {
    return getLocalData(STORAGE_KEYS.MESSAGES, defaultMessages);
  }

  saveMessages(messages: Message[]): void {
    saveLocalData(STORAGE_KEYS.MESSAGES, messages);
  }

  addMessage(message: Message): void {
    const messages = this.getMessages();
    messages.push(message);
    this.saveMessages(messages);
  }

  updateMessage(id: string, updates: Partial<Message>): void {
    const messages = this.getMessages();
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1) {
      messages[index] = { ...messages[index], ...updates };
      this.saveMessages(messages);
    }
  }

  // Tickets
  getTickets(): Ticket[] {
    return getLocalData(STORAGE_KEYS.TICKETS, defaultTickets);
  }

  saveTickets(tickets: Ticket[]): void {
    saveLocalData(STORAGE_KEYS.TICKETS, tickets);
  }

  addTicket(ticket: Ticket): void {
    const tickets = this.getTickets();
    tickets.push(ticket);
    this.saveTickets(tickets);
  }

  updateTicket(id: string, updates: Partial<Ticket>): void {
    const tickets = this.getTickets();
    const index = tickets.findIndex(t => t.id === id);
    if (index !== -1) {
      tickets[index] = { ...tickets[index], ...updates };
      this.saveTickets(tickets);
    }
  }

  // Profile Settings
  getProfileSettings(): ProfileSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE_SETTINGS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Error reading profile settings:', error);
    }
    return defaultProfileSettings;
  }

  saveProfileSettings(settings: ProfileSettings): void {
    saveLocalData(STORAGE_KEYS.PROFILE_SETTINGS, [settings]);
  }

  // Sections
  getSections(): Section[] {
    return getLocalData(STORAGE_KEYS.SECTIONS, defaultSections);
  }

  saveSections(sections: Section[]): void {
    saveLocalData(STORAGE_KEYS.SECTIONS, sections);
  }

  addSection(section: Section): void {
    const sections = this.getSections();
    sections.push(section);
    this.saveSections(sections);
  }

  updateSection(id: string, updates: Partial<Section>): void {
    const sections = this.getSections();
    const index = sections.findIndex(s => s.id === id);
    if (index !== -1) {
      sections[index] = { ...sections[index], ...updates };
      this.saveSections(sections);
    }
  }

  deleteSection(id: string): void {
    const sections = this.getSections();
    const filtered = sections.filter(s => s.id !== id);
    this.saveSections(filtered);
  }

  // Attendance Sessions
  getAttendanceSessions(): AttendanceSession[] {
    return getLocalData(STORAGE_KEYS.ATTENDANCE_SESSIONS, defaultAttendanceSessions);
  }

  saveAttendanceSessions(sessions: AttendanceSession[]): void {
    saveLocalData(STORAGE_KEYS.ATTENDANCE_SESSIONS, sessions);
  }

  addAttendanceSession(session: AttendanceSession): void {
    const sessions = this.getAttendanceSessions();
    sessions.push(session);
    this.saveAttendanceSessions(sessions);
  }

  updateAttendanceSession(id: string, updates: Partial<AttendanceSession>): void {
    const sessions = this.getAttendanceSessions();
    const index = sessions.findIndex(s => s.id === id);
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...updates };
      this.saveAttendanceSessions(sessions);
    }
  }

  // Attendance Records
  getAttendanceRecords(): AttendanceRecord[] {
    return getLocalData(STORAGE_KEYS.ATTENDANCE_RECORDS, defaultAttendanceRecords);
  }

  saveAttendanceRecords(records: AttendanceRecord[]): void {
    saveLocalData(STORAGE_KEYS.ATTENDANCE_RECORDS, records);
  }

  addAttendanceRecord(record: AttendanceRecord): void {
    const records = this.getAttendanceRecords();
    records.push(record);
    this.saveAttendanceRecords(records);
  }

  // Clear all data (for testing)
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

export const localDataStore = new LocalDataStore();
