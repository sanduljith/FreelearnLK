import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { Plus, Youtube, UserPlus, Trash2, X, ChevronRight, LayoutDashboard, Film, Users, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'users'>('courses');
  
  // Form States
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', thumbnailUrl: '' });
  
  const [showVideoModal, setShowVideoModal] = useState<string | null>(null); // courseId
  const [newVideo, setNewVideo] = useState({ title: '', youtubeUrl: '', order: 1 });

  const [showEnrollmentModal, setShowEnrollmentModal] = useState<string | null>(null); // courseId
  const [enrollEmail, setEnrollEmail] = useState('');

  useEffect(() => {
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubEnrollments = onSnapshot(collection(db, 'enrollments'), (snapshot) => {
      setEnrollments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubCourses();
      unsubUsers();
      unsubEnrollments();
    };
  }, []);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleCreateCourse = async () => {
    if (!newCourse.title || !user) return;
    try {
      await addDoc(collection(db, 'courses'), {
        ...newCourse,
        instructorId: user.uid,
        createdAt: serverTimestamp(),
      });
      setShowCourseModal(false);
      setNewCourse({ title: '', description: '', thumbnailUrl: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'courses');
    }
  };

  const handleAddVideo = async (courseId: string) => {
    const videoId = getYoutubeId(newVideo.youtubeUrl);
    if (!videoId || !newVideo.title) {
        alert("Invalid YouTube URL or Title");
        return;
    }

    try {
      await addDoc(collection(db, `courses/${courseId}/videos`), {
        title: newVideo.title,
        youtubeVideoId: videoId,
        courseId,
        order: Number(newVideo.order),
        createdAt: serverTimestamp(),
      });
      setShowVideoModal(null);
      setNewVideo({ title: '', youtubeUrl: '', order: 1 });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'videos');
    }
  };

  const handleEnrollStudent = async (courseId: string) => {
    const student = users.find(u => u.email === enrollEmail);
    if (!student) {
        alert("Student not found with this email. Ask them to sign in first.");
        return;
    }

    try {
      const enrollmentId = `${student.uid}_${courseId}`;
      await setDoc(doc(db, 'enrollments', enrollmentId), {
        userId: student.uid,
        courseId,
        enrolledAt: serverTimestamp(),
      });
      setShowEnrollmentModal(null);
      setEnrollEmail('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'enrollments');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm("Are you sure? This doesn't delete videos but hides them.")) {
        await deleteDoc(doc(db, 'courses', id));
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 border-8 border-slate-200">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-white border-r border-slate-200 p-8 flex flex-col gap-10">
        <div className="flex items-center gap-3">
          <div className="geometric-logo">
             <div className="geometric-logo-inner"></div>
          </div>
          <span className="font-extrabold text-xl tracking-tight uppercase">STRATUM_SYS</span>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-4 px-5 py-4 rounded-none font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === 'courses' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Film className="w-4 h-4" />
            Curriculum_Reg
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-4 px-5 py-4 rounded-none font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Users className="w-4 h-4" />
            Identity_Manager
          </button>
          <Link 
            to="/"
            className="flex items-center gap-4 px-5 py-4 rounded-none font-bold text-[10px] uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 mt-10"
          >
            <ExternalLink className="w-4 h-4" />
            Exit_Terminal
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6 pb-8 border-b border-slate-200">
          <div>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight uppercase">
              {activeTab === 'courses' ? 'Curriculum Control' : 'Identity Registry'}
            </h2>
            <p className="text-slate-400 font-mono text-[10px] uppercase tracking-[0.2em] mt-2">Level 04 Privileged Access • Operational</p>
          </div>
          {activeTab === 'courses' && (
            <button 
                onClick={() => setShowCourseModal(true)}
                className="flex items-center justify-center gap-3 bg-indigo-600 text-white py-3 px-6 rounded-none font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-xl"
            >
                <Plus className="w-5 h-5" />
                Initialize Module
            </button>
          )}
        </header>

        {activeTab === 'courses' ? (
          <div className="grid gap-8">
            {courses.map(course => (
              <motion.div 
                layout
                key={course.id}
                className="bg-white p-8 rounded-none border border-slate-200 shadow-sm hover:shadow-[12px_12px_0px_0px_rgba(15,23,42,0.05)] transition-all"
              >
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-56 h-32 bg-slate-100 relative group overflow-hidden border border-slate-200">
                        <img src={course.thumbnailUrl || 'https://via.placeholder.com/300x168?text=Course'} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all opacity-80" />
                        <div className="absolute inset-0 border-[8px] border-white/20"></div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">{course.title}</h3>
                                <div className="flex items-center gap-3 mt-1 underline underline-offset-4 decoration-indigo-200 text-slate-400 font-mono text-[10px]">
                                    <span>#{course.id.substring(0,8)}</span>
                                    <span>{enrollments.filter(e => e.courseId === course.id).length} ENROLLED</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowEnrollmentModal(course.id)} className="p-3 text-slate-400 hover:text-indigo-600 border border-transparent hover:border-indigo-100 rounded-none transition-colors"><UserPlus className="w-5 h-5" /></button>
                                <button onClick={() => handleDeleteCourse(course.id)} className="p-3 text-slate-400 hover:text-red-500 border border-transparent hover:border-red-100 rounded-none transition-colors"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm mt-4 mb-6 leading-relaxed italic pr-12">"{course.description}"</p>
                        
                        <div className="flex flex-wrap gap-4">
                            <button 
                                onClick={() => setShowVideoModal(course.id)}
                                className="text-[10px] font-bold bg-slate-900 text-white py-2 px-4 rounded-none hover:bg-indigo-600 uppercase tracking-widest flex items-center gap-2 transition-colors"
                            >
                                <Film className="w-4 h-4" />
                                Add_Node
                            </button>
                            <Link 
                                to={`/course/${course.id}`}
                                className="text-[10px] font-bold border border-slate-200 text-slate-400 py-2 px-4 rounded-none hover:bg-slate-50 uppercase tracking-widest flex items-center gap-2 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Inspect_Module
                            </Link>
                        </div>
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-none border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-8 py-5">Identity_Name</th>
                  <th className="px-8 py-5">Core_Contact</th>
                  <th className="px-8 py-5">Clearance_Tier</th>
                  <th className="px-8 py-5 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 font-bold text-slate-900 text-sm uppercase tracking-tight">{u.displayName}</td>
                    <td className="px-8 py-6 text-slate-500 font-mono text-xs">{u.email}</td>
                    <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-none text-[9px] font-bold border uppercase tracking-widest ${u.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                            {u.role}
                        </span>
                    </td>
                    <td className="px-8 py-6 text-slate-400 font-mono text-[10px] text-right">
                        {u.createdAt?.toDate?.()?.toLocaleDateString() || 'RECENT'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modals - All updated to Geometric style */}
      <AnimatePresence>
        {showCourseModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-none p-10 shadow-2xl relative border-8 border-indigo-600">
              <button onClick={() => setShowCourseModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900"><X /></button>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-8 uppercase tracking-tighter">Initialize New Curriculum</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Registry Title</label>
                  <input value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-none focus:border-indigo-600 outline-none text-sm transition-colors" placeholder="e.g. DIGIARCHITECTURE_01" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Scope Summary</label>
                  <textarea value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-none focus:border-indigo-600 outline-none text-sm h-28 resize-none" placeholder="Module objectives..." />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Asset Pointer (Thumbnail URL)</label>
                    <input value={newCourse.thumbnailUrl} onChange={e => setNewCourse({...newCourse, thumbnailUrl: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-none focus:border-indigo-600 outline-none text-sm" placeholder="https://cdn.node/..." />
                </div>
                <button onClick={handleCreateCourse} className="w-full bg-slate-900 text-white py-4 rounded-none font-bold text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-colors mt-4">Confirm Registry</button>
              </div>
            </motion.div>
          </div>
        )}

        {showVideoModal && (
           <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-none p-10 shadow-2xl relative border-8 border-indigo-600">
             <button onClick={() => setShowVideoModal(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900"><X /></button>
             <h3 className="text-2xl font-extrabold text-slate-900 mb-8 uppercase tracking-tighter flex items-center gap-3">
                <div className="w-6 h-6 bg-red-600 flex items-center justify-center rounded-sm">
                   <div className="w-2 h-2 bg-white rotate-45"></div>
                </div>
                Append Video Node
             </h3>
             <div className="space-y-6">
               <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Node Alias (Title)</label>
                 <input value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-none focus:border-indigo-600 outline-none text-sm ml-0" placeholder="e.g. CORE_PRINCIPLES" />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Stream Source (YouTube URL)</label>
                  <input value={newVideo.youtubeUrl} onChange={e => setNewVideo({...newVideo, youtubeUrl: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-none focus:border-indigo-600 outline-none text-sm" placeholder="https://youtube.com/..." />
               </div>
               <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Execution Order (Index)</label>
                    <input type="number" value={newVideo.order} onChange={e => setNewVideo({...newVideo, order: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-none focus:border-indigo-600 outline-none text-sm" />
                </div>
               <button onClick={() => handleAddVideo(showVideoModal!)} className="w-full bg-slate-900 text-white py-4 rounded-none font-bold text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-colors mt-4">Inject Node</button>
             </div>
           </motion.div>
         </div>
        )}

        {showEnrollmentModal && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-none p-10 shadow-2xl relative border-8 border-indigo-600">
                    <button onClick={() => setShowEnrollmentModal(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900"><X /></button>
                    <h3 className="text-2xl font-extrabold text-slate-900 mb-8 uppercase tracking-tighter">Grant Node Access</h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Identity Email</label>
                            <input value={enrollEmail} onChange={e => setEnrollEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-none focus:border-indigo-600 outline-none text-sm" placeholder="user@identity.node" />
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tight italic font-medium leading-relaxed">
                          Note: Student must have completed initial synchronization (first login) to appear in the stratum registry.
                        </p>
                        <button onClick={() => handleEnrollStudent(showEnrollmentModal!)} className="w-full bg-indigo-600 text-white py-4 rounded-none font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors mt-4">Authorize Clearances</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
