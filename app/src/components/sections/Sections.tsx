import { useState, useEffect } from 'react';
import { X, Users, Plus, Trash2, UserPlus, UserMinus, GraduationCap, Search, BookOpen, Award, ChevronDown, ChevronUp } from 'lucide-react';
import type { Section, User, SectionGrade } from '@/types';
import { getSectionGradesBySection, addSectionGrade, deleteSectionGrade } from '@/services/firebaseServices';

interface SectionsProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  students: User[];
  teacherId: string;
  teacherName: string;
  onCreateSection: (name: string, grade: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddStudentToSection: (sectionId: string, studentId: string) => void;
  onRemoveStudentFromSection: (sectionId: string, studentId: string) => void;
}

const GRADE_LEVELS = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const GRADE_CATEGORIES = [
  { value: 'Activity', label: 'Activity' },
  { value: 'Assignment', label: 'Assignment' },
  { value: 'Quiz', label: 'Quiz' },
  { value: 'Exam', label: 'Exam' },
  { value: 'Project', label: 'Project' },
  { value: 'Participation', label: 'Participation' }
] as const;

export function SectionsModal({
  isOpen,
  onClose,
  sections,
  students,
  teacherId,
  teacherName,
  onCreateSection,
  onDeleteSection,
  onAddStudentToSection,
  onRemoveStudentFromSection
}: SectionsProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(GRADE_LEVELS[0]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [searchStudent, setSearchStudent] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'grades'>('students');
  
  // Grade posting state
  const [showGradeForm, setShowGradeForm] = useState(false);
  const [selectedStudentForGrade, setSelectedStudentForGrade] = useState<string>('');
  const [gradeCategory, setGradeCategory] = useState<typeof GRADE_CATEGORIES[number]['value']>('Activity');
  const [categoryNumber, setCategoryNumber] = useState<number>(1);
  const [gradeTitle, setGradeTitle] = useState('');
  const [gradeScore, setGradeScore] = useState<number>(0);
  const [gradeMaxScore, setGradeMaxScore] = useState<number>(100);
  const [gradeRemarks, setGradeRemarks] = useState('');
  const [sectionGrades, setSectionGrades] = useState<SectionGrade[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // Load grades when section changes
  useEffect(() => {
    if (selectedSection) {
      loadSectionGrades(selectedSection);
    } else {
      setSectionGrades([]);
    }
  }, [selectedSection]);

  const loadSectionGrades = async (sectionId: string) => {
    setLoadingGrades(true);
    try {
      const grades = await getSectionGradesBySection(sectionId);
      setSectionGrades(grades);
    } catch (error) {
      console.error('Failed to load section grades:', error);
    } finally {
      setLoadingGrades(false);
    }
  };

  if (!isOpen) return null;

  // Filter sections for this teacher
  const teacherSections = sections.filter(s => s.teacherId === teacherId);

  // Get selected section details
  const activeSection = selectedSection 
    ? teacherSections.find(s => s.id === selectedSection)
    : null;

  // Get students in active section
  const studentsInSection = activeSection
    ? students.filter(s => activeSection.studentIds.includes(s.id))
    : [];

  // Get available students (not in this section, same grade)
  const availableStudents = activeSection
    ? students.filter(s => 
        s.role === 'student' && 
        !activeSection.studentIds.includes(s.id) &&
        s.grade === activeSection.grade &&
        (searchStudent === '' || s.name.toLowerCase().includes(searchStudent.toLowerCase()))
      )
    : [];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSectionName.trim()) {
      onCreateSection(newSectionName.trim(), selectedGrade);
      setNewSectionName('');
      setShowCreateForm(false);
    }
  };

  const handlePostGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSection || !selectedStudentForGrade) return;

    const student = studentsInSection.find(s => s.id === selectedStudentForGrade);
    if (!student) return;

    try {
      await addSectionGrade({
        sectionId: activeSection.id,
        studentId: selectedStudentForGrade,
        studentName: student.name,
        category: gradeCategory,
        categoryNumber,
        title: gradeTitle || `${gradeCategory} #${categoryNumber}`,
        score: gradeScore,
        maxScore: gradeMaxScore,
        remarks: gradeRemarks || undefined,
        datePosted: new Date().toISOString(),
        postedBy: teacherId,
        postedByName: teacherName
      });

      // Reload grades
      await loadSectionGrades(activeSection.id);

      // Reset form
      setShowGradeForm(false);
      setSelectedStudentForGrade('');
      setGradeTitle('');
      setGradeScore(0);
      setGradeMaxScore(100);
      setGradeRemarks('');
      setCategoryNumber(1);
    } catch (error) {
      console.error('Failed to post grade:', error);
      alert('Failed to post grade. Please try again.');
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!confirm('Are you sure you want to delete this grade?')) return;
    
    try {
      await deleteSectionGrade(gradeId);
      if (activeSection) {
        await loadSectionGrades(activeSection.id);
      }
    } catch (error) {
      console.error('Failed to delete grade:', error);
      alert('Failed to delete grade. Please try again.');
    }
  };

  // Get grades for a specific student
  const getStudentGrades = (studentId: string) => {
    return sectionGrades.filter(g => g.studentId === studentId);
  };

  // Calculate student average
  const getStudentAverage = (studentId: string) => {
    const grades = getStudentGrades(studentId);
    if (grades.length === 0) return null;
    const total = grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0);
    return Math.round(total / grades.length);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)] border-[3px] border-[rgba(26,26,26,0.85)] flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                My Sections
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Organize students and manage grades
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Create Section Button */}
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full btn-primary mb-4 flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Create New Section
          </button>
        )}

        {/* Create Section Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateSubmit} className="card p-4 mb-4 space-y-3">
            <h4 className="font-bold text-sm mb-3">Create New Section</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="micro-label block mb-1 text-xs">Section Name</label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  className="input-field text-sm"
                  placeholder="e.g., Section A"
                  required
                />
              </div>
              <div>
                <label className="micro-label block mb-1 text-xs">Grade Level</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="input-field text-sm"
                >
                  {GRADE_LEVELS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary text-sm"
              >
                Create Section
              </button>
            </div>
          </form>
        )}

        {/* Sections List */}
        {teacherSections.length === 0 ? (
          <div className="text-center py-8 bg-[var(--bg-primary)] rounded-xl border-[2px] border-dashed border-[rgba(26,26,26,0.2)]">
            <Users size={32} className="mx-auto mb-2 text-[var(--text-secondary)]" />
            <p className="text-sm text-[var(--text-secondary)]">
              No sections created yet. Create your first section above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Section Selector */}
            <div className="flex flex-wrap gap-2">
              {teacherSections.map(section => (
                <button
                  key={section.id}
                  onClick={() => {
                    setSelectedSection(selectedSection === section.id ? null : section.id);
                    setActiveTab('students');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-[3px] transition-all ${
                    selectedSection === section.id
                      ? 'bg-[var(--accent)] border-[rgba(26,26,26,0.85)]'
                      : 'bg-white border-[rgba(26,26,26,0.2)] hover:border-[rgba(26,26,26,0.4)]'
                  }`}
                >
                  <GraduationCap size={16} />
                  <span className="text-sm font-bold">{section.name}</span>
                  <span className="text-xs text-[var(--text-secondary)]">({section.grade})</span>
                  <span className="ml-1 px-2 py-0.5 bg-white/50 rounded-full text-xs">
                    {section.studentIds.length}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Section Details */}
            {activeSection && (
              <div className="card p-4 border-[3px] border-[rgba(26,26,26,0.85)]">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-base">{activeSection.name}</h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {activeSection.grade} • {activeSection.studentIds.length} students
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onDeleteSection(activeSection.id);
                      setSelectedSection(null);
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                    title="Delete section"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4 border-b border-gray-200 pb-2">
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      activeTab === 'students'
                        ? 'bg-[var(--accent)] text-black'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Users size={16} />
                    Students
                  </button>
                  <button
                    onClick={() => setActiveTab('grades')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      activeTab === 'grades'
                        ? 'bg-[var(--accent)] text-black'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Award size={16} />
                    Grades
                  </button>
                </div>

                {/* Students Tab */}
                {activeTab === 'students' && (
                  <>
                    {/* Students in Section */}
                    <div className="mb-4">
                      <h5 className="text-sm font-bold mb-2 flex items-center gap-2">
                        <Users size={14} />
                        Students in Section
                      </h5>
                      {studentsInSection.length === 0 ? (
                        <p className="text-xs text-[var(--text-secondary)] py-2">
                          No students added yet.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {studentsInSection.map(student => (
                            <div
                              key={student.id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--card-mint)] rounded-full border-[2px] border-[rgba(26,26,26,0.85)]"
                            >
                              <span className="text-xs font-bold">{student.name}</span>
                              <button
                                onClick={() => onRemoveStudentFromSection(activeSection.id, student.id)}
                                className="p-0.5 hover:bg-red-100 rounded-full text-red-600 transition-colors"
                                title="Remove student"
                              >
                                <UserMinus size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Students */}
                    <div>
                      <h5 className="text-sm font-bold mb-2 flex items-center gap-2">
                        <UserPlus size={14} />
                        Add Students
                      </h5>
                      <div className="relative mb-2">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                        <input
                          type="text"
                          value={searchStudent}
                          onChange={(e) => setSearchStudent(e.target.value)}
                          className="w-full h-9 pl-9 pr-4 rounded-full border-[2px] border-[rgba(26,26,26,0.2)] text-sm"
                          placeholder="Search students..."
                        />
                      </div>
                      {availableStudents.length === 0 ? (
                        <p className="text-xs text-[var(--text-secondary)] py-2">
                          {searchStudent ? 'No matching students found.' : 'No available students for this grade level.'}
                        </p>
                      ) : (
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {availableStudents.slice(0, 10).map(student => (
                            <button
                              key={student.id}
                              onClick={() => onAddStudentToSection(activeSection.id, student.id)}
                              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-primary)] transition-colors text-left"
                            >
                              <span className="text-sm">{student.name}</span>
                              <UserPlus size={14} className="text-green-600" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Grades Tab */}
                {activeTab === 'grades' && (
                  <div className="space-y-4">
                    {/* Post Grade Button */}
                    {!showGradeForm && studentsInSection.length > 0 && (
                      <button
                        onClick={() => setShowGradeForm(true)}
                        className="w-full btn-primary flex items-center justify-center gap-2"
                      >
                        <Plus size={16} />
                        Post New Grade
                      </button>
                    )}

                    {/* Grade Form */}
                    {showGradeForm && (
                      <form onSubmit={handlePostGrade} className="card p-4 bg-[var(--bg-primary)] space-y-3">
                        <h5 className="font-bold text-sm flex items-center gap-2">
                          <BookOpen size={14} />
                          Post Grade
                        </h5>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="micro-label block mb-1 text-xs">Student</label>
                            <select
                              value={selectedStudentForGrade}
                              onChange={(e) => setSelectedStudentForGrade(e.target.value)}
                              className="input-field text-sm"
                              required
                            >
                              <option value="">Select Student</option>
                              {studentsInSection.map(student => (
                                <option key={student.id} value={student.id}>{student.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="micro-label block mb-1 text-xs">Category</label>
                            <select
                              value={gradeCategory}
                              onChange={(e) => setGradeCategory(e.target.value as typeof GRADE_CATEGORIES[number]['value'])}
                              className="input-field text-sm"
                            >
                              {GRADE_CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="micro-label block mb-1 text-xs"># Number</label>
                            <input
                              type="number"
                              min={1}
                              value={categoryNumber}
                              onChange={(e) => setCategoryNumber(parseInt(e.target.value) || 1)}
                              className="input-field text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="micro-label block mb-1 text-xs">Score</label>
                            <input
                              type="number"
                              min={0}
                              value={gradeScore}
                              onChange={(e) => setGradeScore(parseFloat(e.target.value) || 0)}
                              className="input-field text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="micro-label block mb-1 text-xs">Max Score</label>
                            <input
                              type="number"
                              min={1}
                              value={gradeMaxScore}
                              onChange={(e) => setGradeMaxScore(parseFloat(e.target.value) || 100)}
                              className="input-field text-sm"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="micro-label block mb-1 text-xs">Title (Optional)</label>
                          <input
                            type="text"
                            value={gradeTitle}
                            onChange={(e) => setGradeTitle(e.target.value)}
                            className="input-field text-sm"
                            placeholder={`${gradeCategory} #${categoryNumber}`}
                          />
                        </div>

                        <div>
                          <label className="micro-label block mb-1 text-xs">Remarks (Optional)</label>
                          <textarea
                            value={gradeRemarks}
                            onChange={(e) => setGradeRemarks(e.target.value)}
                            className="input-field text-sm min-h-[60px] resize-none"
                            placeholder="Add any remarks..."
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowGradeForm(false)}
                            className="flex-1 btn-secondary text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 btn-primary text-sm"
                          >
                            Post Grade
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Students Grades List */}
                    {studentsInSection.length === 0 ? (
                      <div className="text-center py-6 bg-[var(--bg-primary)] rounded-xl">
                        <Award size={32} className="mx-auto mb-2 text-[var(--text-secondary)]" />
                        <p className="text-sm text-[var(--text-secondary)]">
                          No students in this section yet.
                        </p>
                      </div>
                    ) : loadingGrades ? (
                      <div className="text-center py-6">
                        <div className="animate-spin w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full mx-auto" />
                        <p className="text-sm text-[var(--text-secondary)] mt-2">Loading grades...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {studentsInSection.map(student => {
                          const studentGrades = getStudentGrades(student.id);
                          const average = getStudentAverage(student.id);
                          const isExpanded = expandedStudent === student.id;

                          return (
                            <div key={student.id} className="border border-gray-200 rounded-xl overflow-hidden">
                              <button
                                onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                                className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
                                    <span className="text-xs font-bold">
                                      {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="font-bold text-sm">{student.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  {average !== null && (
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                      average >= 75 ? 'bg-green-100 text-green-700' :
                                      average >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      Ave: {average}%
                                    </span>
                                  )}
                                  <span className="text-xs text-[var(--text-secondary)]">
                                    {studentGrades.length} grade{studentGrades.length !== 1 ? 's' : ''}
                                  </span>
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                              </button>

                              {isExpanded && (
                                <div className="p-3 bg-[var(--bg-primary)] border-t border-gray-200">
                                  {studentGrades.length === 0 ? (
                                    <p className="text-xs text-[var(--text-secondary)] text-center py-2">
                                      No grades posted yet.
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {studentGrades.map(grade => (
                                        <div
                                          key={grade.id}
                                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200"
                                        >
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-bold">{grade.title}</span>
                                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                grade.category === 'Activity' ? 'bg-blue-100 text-blue-700' :
                                                grade.category === 'Assignment' ? 'bg-purple-100 text-purple-700' :
                                                grade.category === 'Quiz' ? 'bg-orange-100 text-orange-700' :
                                                grade.category === 'Exam' ? 'bg-red-100 text-red-700' :
                                                grade.category === 'Project' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-700'
                                              }`}>
                                                {grade.category}
                                              </span>
                                            </div>
                                            {grade.remarks && (
                                              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                                {grade.remarks}
                                              </p>
                                            )}
                                            <p className="text-xs text-[var(--text-secondary)]">
                                              {new Date(grade.datePosted).toLocaleDateString()}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <span className={`text-sm font-bold ${
                                              (grade.score / grade.maxScore) >= 0.75 ? 'text-green-600' :
                                              (grade.score / grade.maxScore) >= 0.6 ? 'text-yellow-600' :
                                              'text-red-600'
                                            }`}>
                                              {grade.score}/{grade.maxScore}
                                            </span>
                                            <button
                                              onClick={() => handleDeleteGrade(grade.id)}
                                              className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                                              title="Delete grade"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
