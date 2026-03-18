import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { localDataStore } from './localDataStore';
import type {
  Book,
  User,
  Event,
  Testimonial,
  Announcement,
  Enrollment,
  Grade,
  Message,
  Ticket,
  ProfileSettings,
  Section,
  AttendanceSession,
  AttendanceRecord,
  SectionGrade
} from '@/types';

function handleFirebaseError(operation: string, error: any): void {
  console.warn(`Firebase ${operation} failed:`, error);
}

// Collection names
const COLLECTIONS = {
  BOOKS: 'books',
  USERS: 'users',
  EVENTS: 'events',
  TESTIMONIALS: 'testimonials',
  ANNOUNCEMENTS: 'announcements',
  ENROLLMENTS: 'enrollments',
  GRADES: 'grades',
  MESSAGES: 'messages',
  TICKETS: 'tickets',
  PROFILE_SETTINGS: 'profileSettings',
  SECTIONS: 'sections',
  ATTENDANCE_SESSIONS: 'attendanceSessions',
  ATTENDANCE_RECORDS: 'attendanceRecords',
  SECTION_GRADES: 'sectionGrades'
};

// ==================== BOOKS ====================

export async function getAllBooks(): Promise<Book[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.BOOKS));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
  } catch (error) {
    console.error('Firebase getAllBooks failed:', error);
    throw new Error('Failed to load books from server');
  }
}

export async function getBookById(id: string): Promise<Book | null> {
  try {
    const docRef = doc(db, COLLECTIONS.BOOKS, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Book : null;
  } catch (error) {
    console.error('Firebase getBookById failed:', error);
    throw new Error('Failed to load book from server');
  }
}

export async function addBook(book: Omit<Book, 'id'>): Promise<Book> {
  try {
    const newRef = doc(collection(db, COLLECTIONS.BOOKS));
    const bookWithId = { ...book, id: newRef.id };
    await setDoc(newRef, bookWithId);
    return bookWithId;
  } catch (error) {
    console.error('Firebase addBook failed:', error);
    throw new Error('Failed to add book to server');
  }
}

export async function updateBook(id: string, updates: Partial<Book>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.BOOKS, id), updates);
  } catch (error) {
    console.error('Firebase updateBook failed:', error);
    throw new Error('Failed to update book');
  }
}

export async function deleteBook(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.BOOKS, id));
  } catch (error) {
    console.error('Firebase deleteBook failed:', error);
    throw new Error('Failed to delete book');
  }
}

// ==================== USERS ====================

export async function getAllUsers(): Promise<User[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const { password, ...userData } = data;
      return { id: doc.id, ...userData } as User;
    });
  } catch (error) {
    console.error('Firebase getAllUsers failed:', error);
    throw new Error('Failed to load users from server');
  }
}

export async function getUserById(id: string): Promise<(User & { password?: string }) | null> {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as User & { password?: string } : null;
  } catch (error) {
    console.error('Firebase getUserById failed:', error);
    throw new Error('Failed to load user from server');
  }
}

export async function getUserByEmail(email: string): Promise<(User & { password?: string }) | null> {
  try {
    // ONLY check Firebase - no local storage fallback for shared data
    const q = query(collection(db, COLLECTIONS.USERS), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User & { password?: string };
  } catch (error) {
    console.warn('Firebase query failed, using local fallback:', error);
    return localDataStore.getUserByEmail(email);
  }
}

export async function createUser(user: Omit<User, 'id'> & { password: string }): Promise<User> {
  try {
    const newRef = doc(collection(db, COLLECTIONS.USERS));
    const newUser = { ...user, id: newRef.id };
    await setDoc(newRef, newUser);
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword as User;
  } catch (error: any) {
    console.error('Firebase create user failed:', error);
    // Check for specific Firebase errors
    if (error?.code === 'permission-denied') {
      throw new Error('Permission denied. Please check Firestore security rules allow write access.');
    } else if (error?.code === 'unavailable') {
      throw new Error('Firebase service is unavailable. Please check your internet connection.');
    } else if (error?.code === 'not-found') {
      throw new Error('Database not found. Please ensure Firestore is enabled in your Firebase project.');
    } else if (error?.message?.includes('network')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw new Error(`Firebase error: ${error?.message || 'Unknown error'}`);
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Firebase updateUser failed:', error);
    throw new Error('Failed to update user');
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.USERS, id));
  } catch (error) {
    console.error('Firebase deleteUser failed:', error);
    throw new Error('Failed to delete user');
  }
}

export async function getPendingVerifications(): Promise<User[]> {
  try {
    const q = query(collection(db, COLLECTIONS.USERS), where('verificationPending', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const { password, ...userData } = doc.data();
      return { id: doc.id, ...userData } as User;
    });
  } catch (error) {
    console.error('Firebase getPendingVerifications failed:', error);
    throw new Error('Failed to load pending verifications from server');
  }
}

// ==================== EVENTS ====================

export async function getAllEvents(): Promise<Event[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.EVENTS));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
  } catch (error) {
    console.error('Firebase getAllEvents failed:', error);
    throw new Error('Failed to load events from server');
  }
}

export async function addEvent(event: Omit<Event, 'id'>): Promise<Event> {
  try {
    const newRef = doc(collection(db, COLLECTIONS.EVENTS));
    const eventWithId = { ...event, id: newRef.id };
    await setDoc(newRef, eventWithId);
    return eventWithId;
  } catch (error) {
    console.error('Firebase addEvent failed:', error);
    throw new Error('Failed to add event to server');
  }
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.EVENTS, id), updates);
  } catch (error) {
    console.error('Firebase updateEvent failed:', error);
    throw new Error('Failed to update event');
  }
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.EVENTS, id));
  } catch (error) {
    console.error('Firebase deleteEvent failed:', error);
    throw new Error('Failed to delete event');
  }
}

// ==================== TESTIMONIALS ====================

export async function getAllTestimonials(): Promise<Testimonial[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.TESTIMONIALS));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
  } catch (error) {
    console.error('Firebase getAllTestimonials failed:', error);
    throw new Error('Failed to load testimonials from server');
  }
}

export async function addTestimonial(testimonial: Omit<Testimonial, 'id'>): Promise<Testimonial> {
  try {
    const newRef = doc(collection(db, COLLECTIONS.TESTIMONIALS));
    const testimonialWithId = { ...testimonial, id: newRef.id };
    await setDoc(newRef, testimonialWithId);
    return testimonialWithId;
  } catch (error) {
    console.error('Firebase addTestimonial failed:', error);
    throw new Error('Failed to add testimonial to server');
  }
}

// ==================== ANNOUNCEMENTS ====================
// NOTE: These functions ONLY use Firebase - no localStorage fallback
// This ensures announcements work across all browsers

export async function getAllAnnouncements(): Promise<Announcement[]> {
  try {
    const q = query(collection(db, COLLECTIONS.ANNOUNCEMENTS), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
  } catch (error) {
    console.error('Firebase getAllAnnouncements failed:', error);
    throw new Error('Failed to load announcements from server');
  }
}

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.ANNOUNCEMENTS),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
  } catch (error) {
    console.error('Firebase getActiveAnnouncements failed:', error);
    throw new Error('Failed to load announcements from server');
  }
}

export async function addAnnouncement(announcement: Omit<Announcement, 'id'>): Promise<Announcement> {
  try {
    const newRef = doc(collection(db, COLLECTIONS.ANNOUNCEMENTS));
    const announcementWithId = { ...announcement, id: newRef.id };
    await setDoc(newRef, announcementWithId);
    return announcementWithId;
  } catch (error) {
    console.error('Firebase addAnnouncement failed:', error);
    throw new Error('Failed to add announcement to server');
  }
}

export async function updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, id), updates);
  } catch (error) {
    console.error('Firebase updateAnnouncement failed:', error);
    throw new Error('Failed to update announcement');
  }
}

export async function deleteAnnouncement(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, id));
  } catch (error) {
    console.error('Firebase deleteAnnouncement failed:', error);
    throw new Error('Failed to delete announcement');
  }
}

// ==================== ENROLLMENTS ====================

export async function getAllEnrollments(): Promise<Enrollment[]> {
  try {
    const q = query(collection(db, COLLECTIONS.ENROLLMENTS), orderBy('enrollmentDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment));
  } catch (error) {
    handleFirebaseError('getAllEnrollments', error);
    return localDataStore.getEnrollments();
  }
}

export async function getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.ENROLLMENTS),
      where('studentId', '==', studentId),
      orderBy('enrollmentDate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment));
  } catch (error) {
    handleFirebaseError('getEnrollmentsByStudent', error);
    return localDataStore.getEnrollments().filter(e => e.studentId === studentId);
  }
}

export async function addEnrollment(enrollment: Omit<Enrollment, 'id'>): Promise<Enrollment> {
  const newEnrollment = { ...enrollment, id: `enroll-${Date.now()}` } as Enrollment;
  try {
    const newRef = doc(collection(db, COLLECTIONS.ENROLLMENTS));
    const enrollmentWithId = { ...enrollment, id: newRef.id };
    await setDoc(newRef, enrollmentWithId);
    localDataStore.addEnrollment(enrollmentWithId);
    return enrollmentWithId;
  } catch (error) {
    handleFirebaseError('addEnrollment', error);
    localDataStore.addEnrollment(newEnrollment);
    return newEnrollment;
  }
}

export async function updateEnrollment(id: string, updates: Partial<Enrollment>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.ENROLLMENTS, id), updates);
  } catch (error) {
    handleFirebaseError('updateEnrollment', error);
  }
  localDataStore.updateEnrollment(id, updates);
}

export async function deleteEnrollment(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.ENROLLMENTS, id));
  } catch (error) {
    handleFirebaseError('deleteEnrollment', error);
  }
  // Note: localDataStore doesn't have deleteEnrollment, would need to add if needed
}

// ==================== GRADES ====================

export async function getAllGrades(): Promise<Grade[]> {
  try {
    const q = query(collection(db, COLLECTIONS.GRADES), orderBy('datePosted', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade));
  } catch (error) {
    handleFirebaseError('getAllGrades', error);
    return localDataStore.getGrades();
  }
}

export async function getGradesByStudent(studentId: string): Promise<Grade[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.GRADES),
      where('studentId', '==', studentId),
      orderBy('datePosted', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade));
  } catch (error) {
    handleFirebaseError('getGradesByStudent', error);
    return localDataStore.getGrades().filter(g => g.studentId === studentId);
  }
}

export async function addGrade(grade: Omit<Grade, 'id'>): Promise<Grade> {
  const newGrade = { ...grade, id: `grade-${Date.now()}` } as Grade;
  try {
    const newRef = doc(collection(db, COLLECTIONS.GRADES));
    const gradeWithId = { ...grade, id: newRef.id };
    await setDoc(newRef, gradeWithId);
    localDataStore.addGrade(gradeWithId);
    return gradeWithId;
  } catch (error) {
    handleFirebaseError('addGrade', error);
    localDataStore.addGrade(newGrade);
    return newGrade;
  }
}

export async function updateGrade(id: string, updates: Partial<Grade>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.GRADES, id), updates);
  } catch (error) {
    handleFirebaseError('updateGrade', error);
  }
}

export async function deleteGrade(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.GRADES, id));
  } catch (error) {
    handleFirebaseError('deleteGrade', error);
  }
  localDataStore.deleteGrade(id);
}

// ==================== SECTION GRADES ====================

export async function getAllSectionGrades(): Promise<SectionGrade[]> {
  try {
    const q = query(collection(db, COLLECTIONS.SECTION_GRADES), orderBy('datePosted', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SectionGrade));
  } catch (error) {
    handleFirebaseError('getAllSectionGrades', error);
    return [];
  }
}

export async function getSectionGradesBySection(sectionId: string): Promise<SectionGrade[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.SECTION_GRADES),
      where('sectionId', '==', sectionId),
      orderBy('datePosted', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SectionGrade));
  } catch (error) {
    handleFirebaseError('getSectionGradesBySection', error);
    return [];
  }
}

export async function getSectionGradesByStudent(studentId: string): Promise<SectionGrade[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.SECTION_GRADES),
      where('studentId', '==', studentId),
      orderBy('datePosted', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SectionGrade));
  } catch (error) {
    handleFirebaseError('getSectionGradesByStudent', error);
    return [];
  }
}

export async function addSectionGrade(grade: Omit<SectionGrade, 'id'>): Promise<SectionGrade> {
  try {
    const newRef = doc(collection(db, COLLECTIONS.SECTION_GRADES));
    const gradeWithId = { ...grade, id: newRef.id };
    await setDoc(newRef, gradeWithId);
    return gradeWithId;
  } catch (error) {
    handleFirebaseError('addSectionGrade', error);
    throw new Error('Failed to add section grade');
  }
}

export async function updateSectionGrade(id: string, updates: Partial<SectionGrade>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.SECTION_GRADES, id), updates);
  } catch (error) {
    handleFirebaseError('updateSectionGrade', error);
    throw new Error('Failed to update section grade');
  }
}

export async function deleteSectionGrade(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.SECTION_GRADES, id));
  } catch (error) {
    handleFirebaseError('deleteSectionGrade', error);
    throw new Error('Failed to delete section grade');
  }
}

// ==================== MESSAGES ====================

export async function getAllMessages(): Promise<Message[]> {
  try {
    const q = query(collection(db, COLLECTIONS.MESSAGES), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
  } catch (error) {
    handleFirebaseError('getAllMessages', error);
    return localDataStore.getMessages();
  }
}

export async function getMessagesByUser(userId: string): Promise<Message[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.MESSAGES),
      where('recipientId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
  } catch (error) {
    handleFirebaseError('getMessagesByUser', error);
    return localDataStore.getMessages().filter(m => m.recipientId === userId);
  }
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, COLLECTIONS.MESSAGES),
      where('recipientId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    handleFirebaseError('getUnreadMessageCount', error);
    return localDataStore.getMessages().filter(m => m.recipientId === userId && !m.read).length;
  }
}

export async function addMessage(message: Omit<Message, 'id'>): Promise<Message> {
  const newMessage = { ...message, id: `msg-${Date.now()}` } as Message;
  try {
    const newRef = doc(collection(db, COLLECTIONS.MESSAGES));
    const messageWithId = { ...message, id: newRef.id };
    await setDoc(newRef, messageWithId);
    localDataStore.addMessage(messageWithId);
    return messageWithId;
  } catch (error) {
    handleFirebaseError('addMessage', error);
    localDataStore.addMessage(newMessage);
    return newMessage;
  }
}

export async function markMessageAsRead(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.MESSAGES, id), { read: true });
  } catch (error) {
    handleFirebaseError('markMessageAsRead', error);
  }
  localDataStore.updateMessage(id, { read: true });
}

export async function deleteMessage(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.MESSAGES, id));
  } catch (error) {
    handleFirebaseError('deleteMessage', error);
  }
}

// ==================== TICKETS ====================

export async function getAllTickets(): Promise<Ticket[]> {
  try {
    const q = query(collection(db, COLLECTIONS.TICKETS), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
  } catch (error) {
    handleFirebaseError('getAllTickets', error);
    return localDataStore.getTickets();
  }
}

export async function getTicketsByUser(userId: string): Promise<Ticket[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.TICKETS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
  } catch (error) {
    handleFirebaseError('getTicketsByUser', error);
    return localDataStore.getTickets().filter(t => t.userId === userId);
  }
}

export async function addTicket(ticket: Omit<Ticket, 'id'>): Promise<Ticket> {
  const newTicket = { ...ticket, id: `ticket-${Date.now()}` } as Ticket;
  try {
    const newRef = doc(collection(db, COLLECTIONS.TICKETS));
    const ticketWithId = { ...ticket, id: newRef.id };
    await setDoc(newRef, ticketWithId);
    localDataStore.addTicket(ticketWithId);
    return ticketWithId;
  } catch (error) {
    handleFirebaseError('addTicket', error);
    localDataStore.addTicket(newTicket);
    return newTicket;
  }
}

export async function updateTicket(id: string, updates: Partial<Ticket>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.TICKETS, id), updates);
  } catch (error) {
    handleFirebaseError('updateTicket', error);
  }
  localDataStore.updateTicket(id, updates);
}

export async function deleteTicket(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.TICKETS, id));
  } catch (error) {
    handleFirebaseError('deleteTicket', error);
  }
}

// ==================== PROFILE SETTINGS ====================

export async function getProfileSettings(): Promise<ProfileSettings | null> {
  try {
    const docRef = doc(db, COLLECTIONS.PROFILE_SETTINGS, 'default');
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() as ProfileSettings : null;
  } catch (error) {
    handleFirebaseError('getProfileSettings', error);
    return localDataStore.getProfileSettings();
  }
}

export async function updateProfileSettings(updates: Partial<ProfileSettings>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PROFILE_SETTINGS, 'default');
    await setDoc(docRef, updates, { merge: true });
  } catch (error) {
    handleFirebaseError('updateProfileSettings', error);
  }
  localDataStore.saveProfileSettings({ ...localDataStore.getProfileSettings(), ...updates });
}

// ==================== SECTIONS ====================

export async function getAllSections(): Promise<Section[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.SECTIONS));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section));
  } catch (error) {
    handleFirebaseError('getAllSections', error);
    return localDataStore.getSections();
  }
}

export async function getSectionsByTeacher(teacherId: string): Promise<Section[]> {
  try {
    const q = query(collection(db, COLLECTIONS.SECTIONS), where('teacherId', '==', teacherId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section));
  } catch (error) {
    handleFirebaseError('getSectionsByTeacher', error);
    return localDataStore.getSections().filter(s => s.teacherId === teacherId);
  }
}

export async function createSection(section: Omit<Section, 'id'>): Promise<Section> {
  const newSection = { ...section, id: `section-${Date.now()}` } as Section;
  try {
    const newRef = doc(collection(db, COLLECTIONS.SECTIONS));
    const sectionWithId = { ...section, id: newRef.id };
    await setDoc(newRef, sectionWithId);
    localDataStore.addSection(sectionWithId);
    return sectionWithId;
  } catch (error) {
    handleFirebaseError('createSection', error);
    localDataStore.addSection(newSection);
    return newSection;
  }
}

export async function updateSection(id: string, updates: Partial<Section>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.SECTIONS, id), updates);
  } catch (error) {
    handleFirebaseError('updateSection', error);
  }
  localDataStore.updateSection(id, updates);
}

export async function deleteSection(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.SECTIONS, id));
  } catch (error) {
    handleFirebaseError('deleteSection', error);
  }
  localDataStore.deleteSection(id);
}

// ==================== ATTENDANCE ====================

export async function getAllAttendanceSessions(): Promise<AttendanceSession[]> {
  try {
    const q = query(collection(db, COLLECTIONS.ATTENDANCE_SESSIONS), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceSession));
  } catch (error) {
    handleFirebaseError('getAllAttendanceSessions', error);
    return localDataStore.getAttendanceSessions();
  }
}

export async function getActiveAttendanceSessions(): Promise<AttendanceSession[]> {
  try {
    const now = Date.now();
    const q = query(
      collection(db, COLLECTIONS.ATTENDANCE_SESSIONS),
      where('isActive', '==', true),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceSession));
  } catch (error) {
    handleFirebaseError('getActiveAttendanceSessions', error);
    const now = Date.now();
    return localDataStore.getAttendanceSessions().filter(s => s.isActive && s.expiresAt > now);
  }
}

export async function createAttendanceSession(session: Omit<AttendanceSession, 'id'>): Promise<AttendanceSession> {
  const newSession = { ...session, id: `session-${Date.now()}` } as AttendanceSession;
  try {
    const newRef = doc(collection(db, COLLECTIONS.ATTENDANCE_SESSIONS));
    const sessionWithId = { ...session, id: newRef.id };
    await setDoc(newRef, sessionWithId);
    localDataStore.addAttendanceSession(sessionWithId);
    return sessionWithId;
  } catch (error) {
    handleFirebaseError('createAttendanceSession', error);
    localDataStore.addAttendanceSession(newSession);
    return newSession;
  }
}

export async function updateAttendanceSession(id: string, updates: Partial<AttendanceSession>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.ATTENDANCE_SESSIONS, id), updates);
  } catch (error) {
    handleFirebaseError('updateAttendanceSession', error);
  }
  localDataStore.updateAttendanceSession(id, updates);
}

export async function getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
  try {
    const q = query(collection(db, COLLECTIONS.ATTENDANCE_RECORDS), orderBy('scannedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
  } catch (error) {
    handleFirebaseError('getAllAttendanceRecords', error);
    return localDataStore.getAttendanceRecords();
  }
}

export async function getAttendanceRecordsBySession(sessionId: string): Promise<AttendanceRecord[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.ATTENDANCE_RECORDS),
      where('sessionId', '==', sessionId),
      orderBy('scannedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
  } catch (error) {
    handleFirebaseError('getAttendanceRecordsBySession', error);
    return localDataStore.getAttendanceRecords().filter(r => r.sessionId === sessionId);
  }
}

export async function getAttendanceRecordsByStudent(studentId: string): Promise<AttendanceRecord[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.ATTENDANCE_RECORDS),
      where('studentId', '==', studentId),
      orderBy('scannedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
  } catch (error) {
    handleFirebaseError('getAttendanceRecordsByStudent', error);
    return localDataStore.getAttendanceRecords().filter(r => r.studentId === studentId);
  }
}

export async function markAttendance(record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> {
  const newRecord = { ...record, id: `record-${Date.now()}` } as AttendanceRecord;
  try {
    const newRef = doc(collection(db, COLLECTIONS.ATTENDANCE_RECORDS));
    const recordWithId = { ...record, id: newRef.id };
    await setDoc(newRef, recordWithId);
    localDataStore.addAttendanceRecord(recordWithId);
    return recordWithId;
  } catch (error) {
    handleFirebaseError('markAttendance', error);
    localDataStore.addAttendanceRecord(newRecord);
    return newRecord;
  }
}

// ==================== REAL-TIME LISTENERS ====================

export function subscribeToBooks(callback: (books: Book[]) => void) {
  try {
    return onSnapshot(collection(db, COLLECTIONS.BOOKS), (snapshot) => {
      const books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
      callback(books);
    });
  } catch (error) {
    handleFirebaseError('subscribeToBooks', error);
    // Return a no-op unsubscribe function and call callback with local data
    callback(localDataStore.getBooks());
    return () => {};
  }
}

export function subscribeToSections(callback: (sections: Section[]) => void) {
  try {
    return onSnapshot(collection(db, COLLECTIONS.SECTIONS), (snapshot) => {
      const sections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section));
      callback(sections);
    });
  } catch (error) {
    handleFirebaseError('subscribeToSections', error);
    callback([]);
    return () => {};
  }
}

export function subscribeToUsers(callback: (users: User[]) => void) {
  try {
    return onSnapshot(collection(db, COLLECTIONS.USERS), (snapshot) => {
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        const { password, ...userData } = data;
        return { id: doc.id, ...userData } as User;
      });
      callback(users);
    });
  } catch (error) {
    handleFirebaseError('subscribeToUsers', error);
    callback([]);
    return () => {};
  }
}

export function subscribeToAnnouncements(callback: (announcements: Announcement[]) => void) {
  try {
    const q = query(collection(db, COLLECTIONS.ANNOUNCEMENTS), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const announcements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      callback(announcements);
    });
  } catch (error) {
    handleFirebaseError('subscribeToAnnouncements', error);
    callback(localDataStore.getAnnouncements());
    return () => {};
  }
}

export function subscribeToMessages(userId: string, callback: (messages: Message[]) => void) {
  try {
    const q = query(
      collection(db, COLLECTIONS.MESSAGES),
      where('recipientId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      callback(messages);
    });
  } catch (error) {
    handleFirebaseError('subscribeToMessages', error);
    callback(localDataStore.getMessages().filter(m => m.recipientId === userId));
    return () => {};
  }
}

// ==================== INITIALIZATION ====================

// Initialize default data if collections are empty
export async function initializeDefaultData() {
  try {
    const booksSnapshot = await getDocs(collection(db, COLLECTIONS.BOOKS));
    
    if (booksSnapshot.empty) {
    // Add default books
    const defaultBooks: Omit<Book, 'id'>[] = [
      {
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
        title: 'Charlotte\'s Web',
        author: 'E.B. White',
        description: 'A heartwarming story of friendship between a pig and a spider.',
        genre: 'Fiction',
        grade: '3-6',
        pages: 192,
        available: 6,
        total: 8,
        coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop'
      },
      {
        title: 'The Elements',
        author: 'Theodore Gray',
        description: 'A visual exploration of every known atom in the universe.',
        genre: 'Science',
        grade: '6-12',
        pages: 240,
        available: 2,
        total: 3,
        coverUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=600&fit=crop'
      },
      {
        title: 'Becoming',
        author: 'Michelle Obama',
        description: 'An intimate, powerful, and inspiring memoir by the former First Lady.',
        genre: 'Biography',
        grade: '9-12',
        pages: 448,
        available: 3,
        total: 4,
        coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop'
      }
    ];

    const batch = writeBatch(db);
    defaultBooks.forEach(book => {
      const ref = doc(collection(db, COLLECTIONS.BOOKS));
      batch.set(ref, { ...book, id: ref.id });
    });
    await batch.commit();
  }

  // Initialize events
  const eventsSnapshot = await getDocs(collection(db, COLLECTIONS.EVENTS));
  if (eventsSnapshot.empty) {
    const defaultEvents: Omit<Event, 'id'>[] = [
      {
        title: 'Science Fair Prep',
        date: 'Tuesday',
        time: '3:30 PM',
        description: 'Get help with your science fair project and meet mentors.',
        imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=250&fit=crop'
      },
      {
        title: 'Creative Writing Club',
        date: 'Wednesday',
        time: '4:00 PM',
        description: 'Share your stories and learn new writing techniques.',
        imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=250&fit=crop'
      },
      {
        title: 'Library Orientation',
        date: 'Friday',
        time: '2:00 PM',
        description: 'Learn how to use the library resources effectively.',
        imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=250&fit=crop'
      }
    ];

    const batch = writeBatch(db);
    defaultEvents.forEach(event => {
      const ref = doc(collection(db, COLLECTIONS.EVENTS));
      batch.set(ref, { ...event, id: ref.id });
    });
    await batch.commit();
  }

  // Initialize testimonials
  const testimonialsSnapshot = await getDocs(collection(db, COLLECTIONS.TESTIMONIALS));
  if (testimonialsSnapshot.empty) {
    const defaultTestimonials: Omit<Testimonial, 'id'>[] = [
      { quote: 'The library search makes everything faster.', author: 'Maya', grade: '7th grade' },
      { quote: 'I never miss a return date now.', author: 'Leo', grade: '6th grade' },
      { quote: 'Subjects page helps me plan my week.', author: 'Sara', grade: '8th grade' }
    ];

    const batch = writeBatch(db);
    defaultTestimonials.forEach(testimonial => {
      const ref = doc(collection(db, COLLECTIONS.TESTIMONIALS));
      batch.set(ref, { ...testimonial, id: ref.id });
    });
    await batch.commit();
  }

  // Initialize profile settings
  const settingsDoc = await getDoc(doc(db, COLLECTIONS.PROFILE_SETTINGS, 'default'));
  if (!settingsDoc.exists()) {
    await setDoc(doc(db, COLLECTIONS.PROFILE_SETTINGS, 'default'), {
      supportEmail: 'atggoal@gmail.com'
    });
  }

  // Create admin user if not exists
  const adminQuery = query(collection(db, COLLECTIONS.USERS), where('email', '==', 'admin@schoolportal.edu'));
  const adminSnapshot = await getDocs(adminQuery);
  
  if (adminSnapshot.empty) {
    await setDoc(doc(collection(db, COLLECTIONS.USERS)), {
      name: 'Admin',
      email: 'admin@schoolportal.edu',
      password: 'admin',
      role: 'admin',
      borrowedBooks: [],
      verified: true,
      verificationPending: false
    });
  }
  } catch (error) {
    handleFirebaseError('initializeDefaultData', error);
    // Local data is already initialized via localDataStore
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
  }
}

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
