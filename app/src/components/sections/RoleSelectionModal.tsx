import { useState } from 'react';
import { GraduationCap, User, X } from 'lucide-react';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: 'student' | 'teacher', grade?: string) => void;
  userName: string;
  userEmail: string;
}

export function RoleSelectionModal({ isOpen, onClose, onSelectRole, userName, userEmail }: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>('student');
  const [grade, setGrade] = useState('Grade 7');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSelectRole(selectedRole, selectedRole === 'student' ? grade : undefined);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card p-6 sm:p-8 max-w-md w-full relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-[var(--bg-primary)] rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)] border-[3px] border-[rgba(26,26,26,0.85)] flex items-center justify-center">
            <User size={28} />
          </div>
          <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Complete Your Profile
          </h2>
          <p className="text-[var(--text-secondary)] text-sm">
            Welcome, <span className="font-bold text-[var(--text-primary)]">{userName}</span>!
          </p>
          <p className="text-[var(--text-secondary)] text-xs mt-1">
            {userEmail}
          </p>
        </div>

        {/* Role Selection */}
        <div className="mb-6">
          <label className="micro-label block mb-3 text-[var(--text-secondary)] text-sm">
            Select your account type:
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-[3px] transition-all ${
                selectedRole === 'student'
                  ? 'bg-[var(--card-mint)] border-[rgba(26,26,26,0.85)]'
                  : 'bg-white border-[rgba(26,26,26,0.2)] hover:border-[rgba(26,26,26,0.5)]'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-[2px] ${
                selectedRole === 'student' ? 'bg-[var(--accent)] border-[rgba(26,26,26,0.85)]' : 'bg-[var(--bg-primary)] border-[rgba(26,26,26,0.2)]'
              }`}>
                <GraduationCap size={24} />
              </div>
              <div className="text-center">
                <span className="font-bold text-sm block">Student</span>
                <span className="text-xs text-[var(--text-secondary)]">Auto-approved</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('teacher')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-[3px] transition-all ${
                selectedRole === 'teacher'
                  ? 'bg-[var(--card-peach)] border-[rgba(26,26,26,0.85)]'
                  : 'bg-white border-[rgba(26,26,26,0.2)] hover:border-[rgba(26,26,26,0.5)]'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-[2px] ${
                selectedRole === 'teacher' ? 'bg-[var(--accent)] border-[rgba(26,26,26,0.85)]' : 'bg-[var(--bg-primary)] border-[rgba(26,26,26,0.2)]'
              }`}>
                <User size={24} />
              </div>
              <div className="text-center">
                <span className="font-bold text-sm block">Teacher</span>
                <span className="text-xs text-[var(--text-secondary)]">Needs approval</span>
              </div>
            </button>
          </div>
        </div>

        {/* Grade Selection (only for students) */}
        {selectedRole === 'student' && (
          <div className="mb-6">
            <label className="micro-label block mb-2 text-[var(--text-secondary)] text-sm">
              Select your grade:
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full h-12 px-4 rounded-full border-[3px] border-[rgba(26,26,26,0.85)] text-sm bg-white focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/30 appearance-none cursor-pointer"
            >
              <optgroup label="Junior High School">
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
              </optgroup>
              <optgroup label="Senior High School">
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </optgroup>
            </select>
          </div>
        )}

        {/* Teacher Approval Notice */}
        {selectedRole === 'teacher' && (
          <div className="mb-6 p-4 bg-yellow-50 border-[2px] border-yellow-300 rounded-xl">
            <p className="text-sm text-yellow-800">
              <span className="font-bold">Note:</span> Teacher accounts require admin approval before you can access the portal. You'll receive an email once your account is approved.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-12 bg-[var(--accent)] text-[var(--text-primary)] font-black rounded-full border-[3px] border-[rgba(26,26,26,0.85)] flex items-center justify-center gap-2 hover:translate-y-[-2px] hover:shadow-md transition-all disabled:opacity-70"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-[var(--text-primary)] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Continue as {selectedRole === 'student' ? 'Student' : 'Teacher'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
