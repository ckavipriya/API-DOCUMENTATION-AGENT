import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, User, ArrowRight, Shield, Cpu, Zap, Globe, Layers, ChevronRight, ChevronLeft } from "lucide-react";
import { UserRole } from "../types";
export default function Login({ onLogin, users }) {
    const [selectedUser, setSelectedUser] = useState(null);
    const [step, setStep] = useState("welcome");
    const handleUserSelect = (userId) => {
        setSelectedUser(userId);
        setTimeout(() => {
            onLogin(userId);
        }, 400);
    };
    const getRoleIcon = (role) => {
        switch (role) {
            case UserRole.DEVELOPER: return <Cpu className="w-5 h-5"/>;
            case UserRole.PROJECT_MANAGER: return <Layers className="w-5 h-5"/>;
            case UserRole.QA_ENGINEER: return <Shield className="w-5 h-5"/>;
            case UserRole.API_CONSUMER: return <Globe className="w-5 h-5"/>;
            default: return <User className="w-5 h-5"/>;
        }
    };
    const getRoleColor = (role) => {
        switch (role) {
            case UserRole.DEVELOPER: return "bg-indigo-100 text-indigo-700 border-indigo-200";
            case UserRole.PROJECT_MANAGER: return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case UserRole.QA_ENGINEER: return "bg-purple-100 text-purple-700 border-purple-200";
            case UserRole.API_CONSUMER: return "bg-amber-100 text-amber-700 border-amber-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };
    return (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 p-4 md:p-8">
      {/* The "Inset" Frame */}
      <div className="w-full h-full max-w-6xl max-h-[800px] bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Left Side: Brand & Visuals */}
        <div className="hidden md:flex md:w-5/12 bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Layers className="w-6 h-6"/>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-white tracking-tight">DocAgent AI</span>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">RAG Engine v1.1.0</span>
              </div>
            </div>

            <h1 className="text-4xl font-black text-white leading-tight mb-6">
              Empower your <br />
              <span className="text-indigo-400">API Documentation</span> <br />
              with AI.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Seamlessly parse, index, and query your backend codebase using Gemini-powered vector analysis.
            </p>
          </div>

          <div className="relative z-10 flex gap-4">
            <div className="flex -space-x-3">
              {users.slice(0, 4).map((u, i) => (<div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                  {u.name[0]}
                </div>))}
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
              Trusted by {users.length}+ Team Members
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 opacity-10">
             <Zap className="w-96 h-96 text-white"/>
          </div>
          <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 opacity-10">
             <Cpu className="w-64 h-64 text-white"/>
          </div>
        </div>

        {/* Right Side: Login Content */}
        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center bg-white relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === "welcome" ? (<motion.div key="welcome" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome Back</h2>
                  <p className="text-slate-500 text-sm">Select your workspace role to begin managing project specifications.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-6">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100">
                      <Lock className="w-6 h-6 text-indigo-600"/>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Secure Access</h4>
                      <p className="text-xs text-slate-500">Authentication simulates role-based permissions and workspace context.</p>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-6">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100">
                      <Zap className="w-6 h-6 text-amber-500"/>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Instant Sync</h4>
                      <p className="text-xs text-slate-500">Vector store and RAG pipeline are preserved across sessions.</p>
                    </div>
                  </div>
                </div>

                <button onClick={() => setStep("select-user")} className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4"/>
                </button>
              </motion.div>) : (<motion.div key="select-user" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1">Select Persona</h2>
                    <p className="text-slate-500 text-xs font-medium">Continue as one of the following system actors.</p>
                  </div>
                  <button onClick={() => setStep("welcome")} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-600">
                    <ChevronLeft className="w-5 h-5"/>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[400px] pr-2 no-scrollbar">
                  {users.map((user) => (<button key={user.id} onClick={() => handleUserSelect(user.id)} disabled={selectedUser !== null} className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all group ${selectedUser === user.id
                    ? "bg-indigo-600 border-indigo-600 shadow-lg scale-[0.98]"
                    : "bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50"}`}>
                      <div className="flex items-center gap-4 text-left">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${selectedUser === user.id ? "bg-white/20 text-white border-white/20" : getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <h4 className={`text-sm font-bold ${selectedUser === user.id ? "text-white" : "text-slate-800"}`}>
                            {user.name}
                          </h4>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedUser === user.id ? "text-indigo-100" : "text-slate-400"}`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                      <div className={`p-1.5 rounded-lg transition-all ${selectedUser === user.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600"}`}>
                        {selectedUser === user.id ? (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Lock className="w-4 h-4"/>
                          </motion.div>) : (<ChevronRight className="w-4 h-4"/>)}
                      </div>
                    </button>))}
                </div>

                <div className="pt-4 border-t border-slate-100">
                   <p className="text-[10px] text-slate-400 text-center font-medium uppercase tracking-widest">
                     Session will be initialized with local state
                   </p>
                </div>
              </motion.div>)}
          </AnimatePresence>

          {/* Background pattern for the right side */}
          <div className="absolute -right-24 -bottom-24 w-64 h-64 bg-slate-50 rounded-full opacity-50 -z-10"></div>
          <div className="absolute -left-12 top-12 w-24 h-24 bg-indigo-50 rounded-full opacity-30 -z-10"></div>
        </div>
      </div>
    </div>);
}
