import { useState, useEffect } from 'react';
import { collection, query, getDocs, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { Link } from 'react-router-dom';
import { Play, LogOut, ShieldAlert, BookOpen, User as UserIcon } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { motion } from 'motion/react';

export default function HomePage() {
  const { user, profile, isAdmin } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'courses'));
    const unsubscribeCourses = onSnapshot(q, (snapshot) => {
      const courseList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(courseList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'courses'));

    if (user && !isAdmin) {
      const enrollmentPath = 'enrollments';
      const unsubscribeEnrollments = onSnapshot(collection(db, enrollmentPath), (snapshot) => {
        const ids = new Set(
          snapshot.docs
            .filter(doc => doc.data().userId === user.uid)
            .map(doc => doc.data().courseId)
        );
        setEnrolledCourseIds(ids);
      }, (error) => handleFirestoreError(error, OperationType.LIST, enrollmentPath));
      
      return () => {
        unsubscribeCourses();
        unsubscribeEnrollments();
      };
    }

    setLoading(false);
    return () => unsubscribeCourses();
  }, [user, isAdmin]);

  const handleLogout = () => signOut(auth);

  return (
    <div className="min-h-screen bg-slate-50 border-8 border-slate-200">
      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-20 sticky top-0 shadow-sm" id="main-nav">
        <div className="flex items-center gap-3">
          <div className="geometric-logo">
            <div className="geometric-logo-inner"></div>
          </div>
          <span className="font-bold text-lg tracking-tight uppercase">STRATUM LMS</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-slate-500">
            <Link to="/" className="text-indigo-600">Dashboard</Link>
            <Link to="/" className="hover:text-indigo-600 transition-colors">Curriculum</Link>
            {isAdmin && (
              <Link to="/admin" className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-none border border-indigo-100">Admin_Panel</Link>
            )}
          </div>
          
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold leading-none">{user?.displayName}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-tighter mt-1">{isAdmin ? 'System_Admin' : 'Pro_Student'}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 bg-slate-100 rounded-none border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <header className="mb-12 border-l-4 border-indigo-600 pl-6">
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Active Curriculum</h2>
          <p className="text-slate-500 font-mono text-xs mt-2 uppercase tracking-widest">Section: Advanced Digital Architecture • Terminal 01</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {courses.map((course) => {
            const hasAccess = isAdmin || enrolledCourseIds.has(course.id);
            return (
              <motion.div 
                key={course.id}
                whileHover={{ y: -4 }}
                className="bg-white rounded-none border border-slate-200 group relative transition-shadow hover:shadow-[12px_12px_0px_0px_rgba(79,70,229,0.1)]"
                id={`course-card-${course.id}`}
              >
                <div className="aspect-[16/10] relative overflow-hidden bg-slate-900">
                  <img 
                    src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'} 
                    alt={course.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                  />
                  {!hasAccess && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center border-b-2 border-indigo-600">
                      <ShieldAlert className="w-10 h-10 text-indigo-500 mb-4" />
                      <p className="text-white font-bold uppercase tracking-widest text-xs">Access Encrypted</p>
                      <p className="text-slate-500 text-[10px] mt-2 leading-relaxed">Identity verification required from administration for this node.</p>
                    </div>
                  )}
                  {hasAccess && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-tighter shadow-lg">Unlocked</span>
                    </div>
                  )}
                </div>
                
                <div className="p-8">
                  <h3 className="text-xl font-extrabold text-slate-900 mb-2 truncate uppercase tracking-tight">{course.title}</h3>
                  <p className="text-slate-500 text-xs mb-8 line-clamp-2 leading-relaxed font-medium italic">"{course.description}"</p>
                  
                  {hasAccess ? (
                    <Link 
                      to={`/course/${course.id}`}
                      id={`view-course-${course.id}`}
                      className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-3 rounded-none font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-colors shadow-xl"
                    >
                      Initialize Module
                    </Link>
                  ) : (
                    <button 
                      disabled
                      className="w-full border border-slate-200 text-slate-400 py-3 rounded-none font-bold text-xs uppercase tracking-widest cursor-not-allowed bg-slate-50"
                    >
                      Node_Restricted
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </section>

        {courses.length === 0 && !loading && (
          <div className="bg-white border-2 border-slate-200 rounded-none p-24 text-center">
            <div className="geometric-logo mx-auto scale-150 grayscale opacity-20 mb-8 items-center justify-center flex">
               <div className="geometric-logo-inner"></div>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tighter">No Active Modules</h3>
            <p className="text-slate-400 mt-2 font-mono text-[10px] uppercase">Curriculum repository is currently offline or empty.</p>
          </div>
        )}
      </main>

      <footer className="h-10 bg-slate-900 text-slate-500 flex items-center justify-between px-8 text-[10px] uppercase tracking-widest font-bold mt-auto">
        <div>System Status: <span className="text-green-400">Operational</span></div>
        <div className="flex gap-6">
          <span>Relay: ASIA-SOUTH-01</span>
          <span>Support ID: #STR-{(user?.uid || 'guest').substring(0, 4)}</span>
        </div>
      </footer>
    </div>
  );
}
