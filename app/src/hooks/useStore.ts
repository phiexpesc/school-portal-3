import { useState, useEffect, useCallback, useRef } from 'react';
import { useLoading } from '@/contexts/LoadingContext';
import QRCodeLib from 'qrcode';
import type {
  Book, User, BorrowedBook, Event, Testimonial,
  Announcement, Enrollment, Ticket,
  ProfileSettings, BookFormData, Section
} from '@/types';
import * as firebaseServices from '@/services/firebaseServices';

export function useStore() {
  const { startLoading, stopLoading } = useLoading();
  
  // Core state
  const [books, setBooks] = useState<Book[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Unsubscribe refs for cleanup
  const unsubscribeSections = useRef<(() => void) | null>(null);
  const unsubscribeUsers = useRef<(() => void) | null>(null);

  // Default fallback data
  const defaultBooks: Book[] = [
    {
      id: 'book-1',
      title: 'The Secret Garden',
      author: 'Frances Hodgson Burnett',
      description: 'A classic tale of curiosity, nature, and friendship.',
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
      description: 'Explore the mysteries of the universe.',
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
      description: 'Learn programming fundamentals.',
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
      description: 'A masterpiece of American literature.',
      genre: 'Fiction',
      grade: '9-12',
      pages: 180,
      available: 4,
      total: 6,
      coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop'
    }
  ];

  const defaultEvents: Event[] = [
    {
      id: 'event-1',
      title: 'Science Fair Prep',
      date: 'Tuesday',
      time: '3:30 PM',
      description: 'Get help with your science fair project.',
      imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=250&fit=crop'
    },
    {
      id: 'event-2',
      title: 'Creative Writing Club',
      date: 'Wednesday',
      time: '4:00 PM',
      description: 'Share your stories.',
      imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=250&fit=crop'
    },
    {
      id: 'event-3',
      title: 'Library Orientation',
      date: 'Friday',
      time: '2:00 PM',
      description: 'Learn how to use the library.',
      imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=250&fit=crop'
    }
  ];

  const defaultTestimonials: Testimonial[] = [
    { id: 'test-1', quote: 'The library search makes everything faster.', author: 'Maya', grade: '7th grade' },
    { id: 'test-2', quote: 'I never miss a return date now.', author: 'Leo', grade: '6th grade' },
    { id: 'test-3', quote: 'Subjects page helps me plan my week.', author: 'Sara', grade: '8th grade' }
  ];

  // Initialize data from Firebase on mount
  useEffect(() => {
    const initData = async () => {
      startLoading('Loading data...');
      
      const timeoutId = setTimeout(() => {
        console.warn('Firebase loading timeout - using fallback data');
        setBooks(defaultBooks);
        setEvents(defaultEvents);
        setTestimonials(defaultTestimonials);
        setAnnouncements([]);
        setIsDataLoaded(true);
        stopLoading();
      }, 5000);
      
      try {
        await firebaseServices.initializeDefaultData();
        
        const [booksData, eventsData, testimonialsData, announcementsData, sectionsData, usersData] = await Promise.all([
          firebaseServices.getAllBooks(),
          firebaseServices.getAllEvents(),
          firebaseServices.getAllTestimonials(),
          firebaseServices.getAllAnnouncements(),
          firebaseServices.getAllSections(),
          firebaseServices.getAllUsers()
        ]);
        
        clearTimeout(timeoutId);
        setBooks(booksData.length > 0 ? booksData : defaultBooks);
        setEvents(eventsData.length > 0 ? eventsData : defaultEvents);
        setTestimonials(testimonialsData.length > 0 ? testimonialsData : defaultTestimonials);
        setAnnouncements(announcementsData || []);
        setSections(sectionsData || []);
        setAllUsers(usersData || []);
        setIsDataLoaded(true);
      } catch (error) {
        console.error('Error initializing data:', error);
        clearTimeout(timeoutId);
        setBooks(defaultBooks);
        setEvents(defaultEvents);
        setTestimonials(defaultTestimonials);
        setAnnouncements([]);
        setSections([]);
        setAllUsers([]);
        setIsDataLoaded(true);
      } finally {
        stopLoading();
      }
    };

    initData();
  }, []);

  // Set up real-time listeners for cross-browser sync
  useEffect(() => {
    // Subscribe to sections for real-time updates
    unsubscribeSections.current = firebaseServices.subscribeToSections((updatedSections) => {
      setSections(updatedSections);
    });

    // Subscribe to users for real-time updates
    unsubscribeUsers.current = firebaseServices.subscribeToUsers((updatedUsers) => {
      setAllUsers(updatedUsers);
    });

    return () => {
      if (unsubscribeSections.current) {
        unsubscribeSections.current();
      }
      if (unsubscribeUsers.current) {
        unsubscribeUsers.current();
      }
    };
  }, []);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('schoolPortalUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('schoolPortalUser');
      }
    }
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; role?: 'student' | 'teacher' | 'admin'; error?: string; pending?: boolean }> => {
    startLoading('Logging in...');
    try {
      const foundUser = await firebaseServices.getUserByEmail(email);
      
      if (!foundUser) {
        return { success: false, error: 'Account not found. Please register first.' };
      }
      
      if (foundUser.password !== password) {
        return { success: false, error: 'Incorrect password.' };
      }

      if (foundUser.verificationPending) {
        return { success: false, error: 'Your account is pending admin approval.', pending: true };
      }

      if (!foundUser.verified) {
        return { success: false, error: 'Your account has not been approved.' };
      }
      
      const { password: _, ...userWithoutPassword } = foundUser;
      setIsLoggedIn(true);
      setUser(userWithoutPassword);
      localStorage.setItem('schoolPortalUser', JSON.stringify(userWithoutPassword));
      return { success: true, role: foundUser.role };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login.' };
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // Logout
  const logout = useCallback(() => {
    startLoading('Logging out...');
    setTimeout(() => {
      setIsLoggedIn(false);
      setUser(null);
      localStorage.removeItem('schoolPortalUser');
      stopLoading();
    }, 300);
  }, [startLoading, stopLoading]);

  // Register
  const register = useCallback(async (name: string, email: string, password: string, role: 'student' | 'teacher' | 'admin', grade?: string) => {
    startLoading('Creating account...');
    try {
      const existingUser = await firebaseServices.getUserByEmail(email);
      if (existingUser) {
        return { success: false, error: 'Email already registered.' };
      }
      
      if (email === 'admin@schoolportal.edu') {
        return { success: false, error: 'This email is reserved.' };
      }
      
      const isStudent = role === 'student';
      
      // Build user object - only include grade for students
      const userData: any = {
        name,
        email,
        password,
        role,
        borrowedBooks: [],
        verified: isStudent,
        verificationPending: !isStudent
      };
      
      // Only add grade for students (Firebase doesn't allow undefined)
      if (isStudent) {
        userData.grade = grade || '7th';
      }
      
      const newUser = await firebaseServices.createUser(userData);
      
      if (isStudent) {
        setUser(newUser);
        setIsLoggedIn(true);
        localStorage.setItem('schoolPortalUser', JSON.stringify(newUser));
        return { success: true, error: null, autoVerified: true };
      } else {
        return { success: true, error: null, pending: true };
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error?.message || 'An error occurred during registration.';
      return { success: false, error: errorMessage };
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // Update user profile
  const updateUserProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    startLoading('Updating profile...');
    try {
      await firebaseServices.updateUser(user.id, updates);
      setUser(prev => prev ? { ...prev, ...updates } : null);
      localStorage.setItem('schoolPortalUser', JSON.stringify({ ...user, ...updates }));
    } catch (error) {
      console.error('Update profile error:', error);
    } finally {
      stopLoading();
    }
  }, [user, startLoading, stopLoading]);

  // Book operations
  const MAX_BOOKS_PER_STUDENT = 5;

  const rentBook = useCallback(async (bookId: string): Promise<{ success: boolean; message?: string }> => {
    startLoading('Renting book...');
    try {
      const currentBorrowedCount = user?.borrowedBooks.filter(bb => !bb.returned).length || 0;
      if (currentBorrowedCount >= MAX_BOOKS_PER_STUDENT) {
        return { success: false, message: `You can only borrow up to ${MAX_BOOKS_PER_STUDENT} books.` };
      }

      const book = books.find(b => b.id === bookId);
      if (!book || book.available <= 0) {
        return { success: false, message: 'Book is not available.' };
      }

      await firebaseServices.updateBook(bookId, { available: book.available - 1 });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const newBorrowedBook: BorrowedBook = {
        bookId,
        borrowedDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        returned: false
      };

      const updatedBorrowedBooks = [...user!.borrowedBooks, newBorrowedBook];
      await firebaseServices.updateUser(user!.id, { borrowedBooks: updatedBorrowedBooks });
      
      setUser(prev => prev ? { ...prev, borrowedBooks: updatedBorrowedBooks } : null);
      
      // Update local books state
      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, available: b.available - 1 } : b));
      
      return { success: true };
    } catch (error) {
      console.error('Rent book error:', error);
      return { success: false, message: 'An error occurred while renting the book.' };
    } finally {
      stopLoading();
    }
  }, [user, books, startLoading, stopLoading]);

  const returnBook = useCallback(async (bookId: string) => {
    startLoading('Returning book...');
    try {
      const book = books.find(b => b.id === bookId);
      if (book) {
        await firebaseServices.updateBook(bookId, { available: Math.min(book.available + 1, book.total) });
      }

      const updatedBorrowedBooks = user!.borrowedBooks.map(bb =>
        bb.bookId === bookId && !bb.returned
          ? { ...bb, returned: true, returnedDate: new Date().toISOString().split('T')[0] }
          : bb
      );

      await firebaseServices.updateUser(user!.id, { borrowedBooks: updatedBorrowedBooks });
      setUser(prev => prev ? { ...prev, borrowedBooks: updatedBorrowedBooks } : null);
      
      // Update local books state
      if (book) {
        setBooks(prev => prev.map(b => b.id === bookId ? { ...b, available: Math.min(b.available + 1, b.total) } : b));
      }
    } catch (error) {
      console.error('Return book error:', error);
    } finally {
      stopLoading();
    }
  }, [user, books, startLoading, stopLoading]);

  const getBorrowedBooksDetails = useCallback(() => {
    if (!user) return [];
    return user.borrowedBooks
      .filter(bb => !bb.returned)
      .map(bb => {
        const book = books.find(b => b.id === bb.bookId);
        return { ...bb, book };
      })
      .filter(item => item.book) as (BorrowedBook & { book: Book })[];
  }, [user, books]);

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || book.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const genres = ['All', ...Array.from(new Set(books.map(b => b.genre)))];

  const getDueSoonBooks = useCallback(() => {
    if (!user) return [];
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    return user.borrowedBooks.filter(bb => {
      if (bb.returned) return false;
      const dueDate = new Date(bb.dueDate);
      return dueDate <= threeDaysFromNow && dueDate >= today;
    });
  }, [user]);

  // ==================== ADMIN FUNCTIONS ====================
  
  // Books
  const addBook = useCallback(async (bookData: BookFormData) => {
    startLoading('Adding book...');
    try {
      const newBook = await firebaseServices.addBook(bookData as Omit<Book, 'id'>);
      setBooks(prev => [...prev, newBook]);
    } catch (error) {
      console.error('Add book error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const updateBook = useCallback(async (bookId: string, bookData: Partial<Book>) => {
    startLoading('Updating book...');
    try {
      await firebaseServices.updateBook(bookId, bookData);
      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, ...bookData } : b));
    } catch (error) {
      console.error('Update book error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const deleteBook = useCallback(async (bookId: string) => {
    startLoading('Deleting book...');
    try {
      await firebaseServices.deleteBook(bookId);
      setBooks(prev => prev.filter(b => b.id !== bookId));
    } catch (error) {
      console.error('Delete book error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const getLibraryStats = useCallback(async () => {
    const totalBooks = books.reduce((sum, book) => sum + book.total, 0);
    const totalAvailable = books.reduce((sum, book) => sum + book.available, 0);
    const totalBorrowed = totalBooks - totalAvailable;
    
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    let overdueBooks = 0;
    let dueSoonBooks = 0;
    
    const allUsers = await firebaseServices.getAllUsers();
    allUsers.forEach(dbUser => {
      dbUser.borrowedBooks.forEach(bb => {
        if (bb.returned) return;
        const dueDate = new Date(bb.dueDate);
        if (dueDate < today) {
          overdueBooks++;
        } else if (dueDate <= threeDaysFromNow) {
          dueSoonBooks++;
        }
      });
    });
    
    return {
      totalBooks,
      totalBorrowed,
      totalAvailable,
      overdueBooks,
      dueSoonBooks,
      totalUsers: allUsers.length
    };
  }, [books]);

  const getAllBorrowedBooks = useCallback(async () => {
    const allBorrowed: (BorrowedBook & { book: Book; userName: string })[] = [];
    const allUsers = await firebaseServices.getAllUsers();
    
    allUsers.forEach(dbUser => {
      dbUser.borrowedBooks
        .filter(bb => !bb.returned)
        .forEach(bb => {
          const book = books.find(b => b.id === bb.bookId);
          if (book) {
            allBorrowed.push({ ...bb, book, userName: dbUser.name });
          }
        });
    });
    
    return allBorrowed;
  }, [books]);

  // Announcements
  const getAnnouncements = useCallback(async () => {
    const data = await firebaseServices.getAllAnnouncements();
    setAnnouncements(data);
    return data;
  }, []);

  const addAnnouncement = useCallback(async (title: string, message: string) => {
    startLoading('Adding announcement...');
    try {
      const newAnnouncement = await firebaseServices.addAnnouncement({
        title,
        message,
        createdAt: new Date().toISOString(),
        active: true
      });
      setAnnouncements(prev => [newAnnouncement, ...prev]);
    } catch (error) {
      console.error('Add announcement error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const updateAnnouncement = useCallback(async (id: string, updates: Partial<Announcement>) => {
    startLoading('Updating announcement...');
    try {
      await firebaseServices.updateAnnouncement(id, updates);
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    } catch (error) {
      console.error('Update announcement error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    startLoading('Deleting announcement...');
    try {
      await firebaseServices.deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Delete announcement error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // Users
  const getAllUsers = useCallback(async () => {
    return await firebaseServices.getAllUsers();
  }, []);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    startLoading('Updating user...');
    try {
      await firebaseServices.updateUser(userId, updates);
      if (user?.id === userId) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('schoolPortalUser', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Update user error:', error);
    } finally {
      stopLoading();
    }
  }, [user, startLoading, stopLoading]);

  const deleteUser = useCallback(async (userId: string) => {
    startLoading('Deleting user...');
    try {
      await firebaseServices.deleteUser(userId);
    } catch (error) {
      console.error('Delete user error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // Verifications
  const getPendingVerifications = useCallback(async () => {
    return await firebaseServices.getPendingVerifications();
  }, []);

  const approveUser = useCallback(async (userId: string) => {
    startLoading('Approving user...');
    try {
      await firebaseServices.updateUser(userId, { verified: true, verificationPending: false });
    } catch (error) {
      console.error('Approve user error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const rejectUser = useCallback(async (userId: string) => {
    startLoading('Rejecting user...');
    try {
      await firebaseServices.updateUser(userId, { verified: false, verificationPending: false });
    } catch (error) {
      console.error('Reject user error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // Events
  const addEvent = useCallback(async (title: string, date: string, time: string, description: string, imageUrl?: string) => {
    startLoading('Adding event...');
    try {
      const newEvent = await firebaseServices.addEvent({
        title,
        date,
        time,
        description,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400&h=250&fit=crop'
      });
      setEvents(prev => [...prev, newEvent]);
    } catch (error) {
      console.error('Add event error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const updateEvent = useCallback(async (eventId: string, updates: Partial<Event>) => {
    startLoading('Updating event...');
    try {
      await firebaseServices.updateEvent(eventId, updates);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updates } : e));
    } catch (error) {
      console.error('Update event error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const deleteEvent = useCallback(async (eventId: string) => {
    startLoading('Deleting event...');
    try {
      await firebaseServices.deleteEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Delete event error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // Enrollments
  const getEnrollments = useCallback(async () => {
    return await firebaseServices.getAllEnrollments();
  }, []);

  const addEnrollment = useCallback(async (studentId: string, studentName: string, gradeLevel: string, notes?: string) => {
    startLoading('Creating enrollment...');
    try {
      return await firebaseServices.addEnrollment({
        studentId,
        studentName,
        course: gradeLevel,
        status: 'pending',
        enrollmentDate: new Date().toISOString(),
        attempts: 1,
        notes
      });
    } catch (error) {
      console.error('Add enrollment error:', error);
      return null;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const updateEnrollment = useCallback(async (id: string, updates: Partial<Enrollment>) => {
    startLoading('Updating enrollment...');
    try {
      await firebaseServices.updateEnrollment(id, updates);
    } catch (error) {
      console.error('Update enrollment error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // Grades
  const getGrades = useCallback(async () => {
    return await firebaseServices.getAllGrades();
  }, []);

  const addGrade = useCallback(async (studentId: string, subject: string, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4', grade: number, maxGrade: number, remarks?: string, postedBy?: string) => {
    startLoading('Adding grade...');
    try {
      const student = await firebaseServices.getUserById(studentId);
      await firebaseServices.addGrade({
        studentId,
        studentGrade: student?.grade || 'Unknown',
        subject,
        quarter,
        grade,
        maxGrade,
        remarks,
        datePosted: new Date().toISOString(),
        postedBy: postedBy || 'Admin'
      });
    } catch (error) {
      console.error('Add grade error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const deleteGrade = useCallback(async (id: string) => {
    startLoading('Deleting grade...');
    try {
      await firebaseServices.deleteGrade(id);
    } catch (error) {
      console.error('Delete grade error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // Messages
  const getMessages = useCallback(async () => {
    return await firebaseServices.getAllMessages();
  }, []);

  const sendMessage = useCallback(async (senderId: string, senderName: string, senderRole: 'student' | 'teacher' | 'admin', recipientId: string, recipientName: string, subject: string, content: string) => {
    startLoading('Sending message...');
    try {
      await firebaseServices.addMessage({
        senderId,
        senderName,
        senderRole,
        recipientId,
        recipientName,
        subject,
        content,
        timestamp: new Date().toISOString(),
        read: false
      });
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const markMessageAsRead = useCallback(async (id: string) => {
    try {
      await firebaseServices.markMessageAsRead(id);
    } catch (error) {
      console.error('Mark message as read error:', error);
    }
  }, []);

  const getUnreadMessageCount = useCallback(async (userId: string) => {
    return await firebaseServices.getUnreadMessageCount(userId);
  }, []);

  // Tickets
  const getTickets = useCallback(async () => {
    return await firebaseServices.getAllTickets();
  }, []);

  const createTicket = useCallback(async (userId: string, userName: string, userEmail: string, subject: string, message: string, category: 'bug' | 'feature' | 'support' | 'other') => {
    startLoading('Creating ticket...');
    try {
      await firebaseServices.addTicket({
        userId,
        userName,
        userEmail,
        subject,
        message,
        category,
        status: 'open',
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Create ticket error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const updateTicket = useCallback(async (id: string, updates: Partial<Ticket>) => {
    startLoading('Updating ticket...');
    try {
      await firebaseServices.updateTicket(id, updates);
    } catch (error) {
      console.error('Update ticket error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // Profile Settings
  const getProfileSettings = useCallback(async () => {
    const settings = await firebaseServices.getProfileSettings();
    return settings || { supportEmail: 'atggoal@gmail.com' };
  }, []);

  const updateProfileSettings = useCallback(async (updates: Partial<ProfileSettings>) => {
    startLoading('Updating settings...');
    try {
      await firebaseServices.updateProfileSettings(updates);
    } catch (error) {
      console.error('Update profile settings error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // Sections
  const getSections = useCallback(async () => {
    return sections;
  }, [sections]);

  const createSection = useCallback(async (name: string, grade: string, teacherId: string, teacherName: string) => {
    startLoading('Creating section...');
    try {
      const newSection = await firebaseServices.createSection({
        name,
        grade,
        teacherId,
        teacherName,
        studentIds: [],
        createdAt: new Date().toISOString()
      });
      // Local state will be updated by the real-time listener
      return newSection;
    } catch (error) {
      console.error('Create section error:', error);
      throw error;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const deleteSection = useCallback(async (sectionId: string) => {
    startLoading('Deleting section...');
    try {
      await firebaseServices.deleteSection(sectionId);
      // Local state will be updated by the real-time listener
    } catch (error) {
      console.error('Delete section error:', error);
      throw error;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const addStudentToSection = useCallback(async (sectionId: string, studentId: string) => {
    startLoading('Adding student...');
    try {
      const section = sections.find(s => s.id === sectionId);
      if (section) {
        await firebaseServices.updateSection(sectionId, { studentIds: [...section.studentIds, studentId] });
      }
      // Local state will be updated by the real-time listener
    } catch (error) {
      console.error('Add student to section error:', error);
      throw error;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading, sections]);

  const removeStudentFromSection = useCallback(async (sectionId: string, studentId: string) => {
    startLoading('Removing student...');
    try {
      const section = sections.find(s => s.id === sectionId);
      if (section) {
        await firebaseServices.updateSection(sectionId, { studentIds: section.studentIds.filter(id => id !== studentId) });
      }
      // Local state will be updated by the real-time listener
    } catch (error) {
      console.error('Remove student from section error:', error);
      throw error;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading, sections]);

  // Attendance
  const getAttendanceSessions = useCallback(async () => {
    return await firebaseServices.getAllAttendanceSessions();
  }, []);

  const getAttendanceRecords = useCallback(async () => {
    return await firebaseServices.getAllAttendanceRecords();
  }, []);

  const createAttendanceSession = useCallback(async (teacherId: string, sectionId: string, sectionName: string, expiresInMinutes: number) => {
    startLoading('Creating session...');
    try {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiresAt = Date.now() + expiresInMinutes * 60000;
      
      const qrData = JSON.stringify({ type: 'attendance', sessionId: Date.now().toString(), code });
      const qrDataUrl = await QRCodeLib.toDataURL(qrData, { width: 256, margin: 2, color: { dark: '#1a1a1a', light: '#ffffff' } });

      await firebaseServices.createAttendanceSession({
        teacherId,
        sectionId,
        sectionName,
        date: new Date().toISOString(),
        qrCode: code,
        qrDataUrl,
        expiresAt,
        createdAt: Date.now(),
        isActive: true
      });
    } catch (error) {
      console.error('Create attendance session error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const markAttendance = useCallback(async (sessionId: string, studentId: string, studentName: string) => {
    startLoading('Marking attendance...');
    try {
      await firebaseServices.markAttendance({
        sessionId,
        studentId,
        studentName,
        date: new Date().toISOString(),
        status: 'present',
        scannedAt: Date.now()
      });
    } catch (error) {
      console.error('Mark attendance error:', error);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const cleanupExpiredSessions = useCallback(async () => {
    try {
      const sessions = await firebaseServices.getAllAttendanceSessions();
      const now = Date.now();
      const expiredSessions = sessions.filter(s => s.expiresAt < now && s.isActive);
      for (const session of expiredSessions) {
        await firebaseServices.updateAttendanceSession(session.id, { isActive: false });
      }
    } catch (error) {
      console.error('Cleanup expired sessions error:', error);
    }
  }, []);

  const isAdmin = user?.role === 'admin';

  return {
    // State
    books,
    user,
    events,
    testimonials,
    announcements,
    sections,
    allUsers,
    isLoggedIn,
    isAdmin,
    searchQuery,
    selectedGenre,
    genres,
    filteredBooks,
    isDataLoaded,
    
    // Setters
    setSearchQuery,
    setSelectedGenre,
    setUser,
    
    // Auth
    login,
    logout,
    register,
    updateUserProfile,
    
    // Books
    rentBook,
    returnBook,
    getBorrowedBooksDetails,
    getDueSoonBooks,
    addBook,
    updateBook,
    deleteBook,
    getLibraryStats,
    getAllBorrowedBooks,
    
    // Announcements
    getAnnouncements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    
    // Users
    getAllUsers,
    updateUser,
    deleteUser,
    getPendingVerifications,
    approveUser,
    rejectUser,
    
    // Events
    addEvent,
    updateEvent,
    deleteEvent,
    
    // Enrollments
    getEnrollments,
    addEnrollment,
    updateEnrollment,
    
    // Grades
    getGrades,
    addGrade,
    deleteGrade,
    
    // Messages
    getMessages,
    sendMessage,
    markMessageAsRead,
    getUnreadMessageCount,
    
    // Tickets
    getTickets,
    createTicket,
    updateTicket,
    
    // Profile
    getProfileSettings,
    updateProfileSettings,
    
    // Sections
    getSections,
    createSection,
    deleteSection,
    addStudentToSection,
    removeStudentFromSection,
    
    // Attendance
    getAttendanceSessions,
    getAttendanceRecords,
    createAttendanceSession,
    markAttendance,
    cleanupExpiredSessions
  };
}
