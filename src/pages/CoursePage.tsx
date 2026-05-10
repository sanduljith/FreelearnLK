import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { collection, query, onSnapshot, doc, getDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { ChevronLeft, PlayCircle, CheckCircle2, Lock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, isAdmin } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [activeVideo, setActiveVideo] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    const checkAccess = async () => {
      if (isAdmin) {
        setHasAccess(true);
        return;
      }
      try {
        const enrollmentId = `${user?.uid}_${courseId}`;
        const enrollmentDoc = await getDoc(doc(db, 'enrollments', enrollmentId));
        setHasAccess(enrollmentDoc.exists());
      } catch (err) {
        console.error("Access check failed", err);
        setHasAccess(false);
      }
    };
    checkAccess();

    const unsubscribeCourse = onSnapshot(doc(db, 'courses', courseId), (snapshot) => {
      if (snapshot.exists()) {
        setCourse({ id: snapshot.id, ...snapshot.data() });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `courses/${courseId}`));

    const q = query(collection(db, `courses/${courseId}/videos`), orderBy('order', 'asc'));
    const unsubscribeVideos = onSnapshot(q, (snapshot) => {
      const videoList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVideos(videoList);
      if (videoList.length > 0 && !activeVideo) {
        setActiveVideo(videoList[0]);
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `courses/${courseId}/videos`));

    return () => {
      unsubscribeCourse();
      unsubscribeVideos();
    };
  }, [courseId, user, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="geometric-logo animate-spin">
           <div className="geometric-logo-inner"></div>
        </div>
      </div>
    );
  }

  if (hasAccess === false) {
    return <Navigate to="/" />;
  }

  const activeIndex = videos.indexOf(activeVideo);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden border-8 border-slate-200 h-screen">
      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-20">
        <div className="flex items-center gap-6">
          <Link to="/" className="p-2 hover:bg-slate-100 transition-colors border border-slate-200">
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </Link>
          <div className="flex items-center gap-3">
             <div className="geometric-logo scale-75">
                <div className="geometric-logo-inner"></div>
             </div>
             <div>
                <h1 className="text-sm font-extrabold tracking-tight text-slate-900 uppercase truncate max-w-[150px] sm:max-w-xs">{course?.title}</h1>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{videos.length} NODES</p>
             </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 border border-slate-200">ENCRYPTED STREAM</span>
        </div>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main Viewer */}
        <main className="flex-1 p-8 lg:p-12 flex flex-col gap-8 overflow-y-auto">
          <header className="flex justify-between items-end gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
                {activeIndex + 1}. {activeVideo?.title}
              </h1>
              <p className="text-slate-500 mt-3 text-xs font-medium uppercase tracking-widest">Section: {course?.title} • Terminal {activeIndex + 1}</p>
            </div>
            <button className="hidden sm:block px-6 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-none hover:bg-indigo-600 transition-colors">
              Resources
            </button>
          </header>

          <div className="relative aspect-video bg-black shadow-[32px_32px_0px_-16px_rgba(79,70,229,0.05)] ring-1 ring-slate-200">
            {activeVideo ? (
              <iframe
                id="youtube-player"
                className="w-full h-full border-none"
                src={`https://www.youtube.com/embed/${activeVideo.youtubeVideoId}?rel=0&modestbranding=1&disablekb=1&controls=1&showinfo=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                 <div className="geometric-logo scale-[3] opacity-10">
                    <div className="geometric-logo-inner"></div>
                 </div>
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none border-[1px] border-white/10"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <h3 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-indigo-600 rotate-45"></div>
                 About This Module
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {course?.description || 'No description provided for this specific module.'}
              </p>
            </div>
            <div className="bg-white p-6 border border-slate-200 flex flex-col gap-4 shadow-sm h-fit">
              <h3 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest">Network Access</h3>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-tighter">Verified Secure</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium uppercase tracking-tighter">You have permanent clearance to stream this content inside Stratum. Local caching is restricted for IP security.</p>
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="w-full lg:w-96 bg-white border-l border-slate-200 flex flex-col h-full lg:sticky lg:top-0">
          <div className="p-8 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-between">
              Module Registry
              <span className="font-mono text-indigo-600 font-bold">{activeIndex + 1} / {videos.length}</span>
            </h3>
            
            <div className="space-y-3">
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <motion.div 
                   className="h-full bg-indigo-600" 
                   initial={{ width: 0 }}
                   animate={{ width: `${((activeIndex + 1) / videos.length) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">PROGRESS SYNCHRONIZED</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {videos.map((video, index) => {
              const isActive = activeVideo?.id === video.id;
              const isComp = index < activeIndex;
              return (
                <button
                  key={video.id}
                  onClick={() => setActiveVideo(video)}
                  className={`w-full p-6 text-left transition-all flex items-start gap-4 group relative
                    ${isActive ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50 border-l-4 border-transparent'}
                  `}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-6 h-6 flex items-center justify-center font-bold text-[10px]
                    ${isActive ? 'bg-indigo-600 text-white' : isComp ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}
                  `}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold leading-tight transition-colors ${isActive ? 'text-indigo-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                      {video.title}
                    </p>
                    <div className="flex items-center gap-3 mt-2 font-mono text-[10px] text-slate-400 uppercase tracking-tighter">
                       <span>Node_{video.id.substring(0,4)}</span>
                       {isActive && <span className="text-indigo-600 font-bold uppercase tracking-widest text-[9px] animate-pulse">STREAMING_NOW</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      <footer className="h-10 bg-slate-900 text-slate-500 flex items-center justify-between px-8 text-[10px] uppercase tracking-widest font-bold">
        <div className="flex items-center gap-4">
           <span>Status: <span className="text-green-400 tracking-tighter">READY</span></span>
           <span className="hidden sm:inline border-l border-slate-800 pl-4">Network: AES-256-GCM</span>
        </div>
        <div className="flex gap-6">
          <span>Relay_ID: #{courseId?.substring(0, 8)}</span>
          <span className="hidden sm:inline">Support: #STR-{(user?.uid || 'guest').substring(0, 4)}</span>
        </div>
      </footer>
    </div>
  );
}
