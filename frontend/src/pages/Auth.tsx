import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
import trinityLogo from "@/assets/trinity-house-logo.png"; // Make sure this path is correct

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 🌟 FIXED: Added "/api" prefix to match your root Django urls.py path configuration
    const endpoint = isLogin ? "/setups/auth/login/" : "/setups/auth/register/";
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Save the Token and User data to LocalStorage (matches the App.tsx RoleGuard keys)
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // 🚦 THE REDIRECT SPLIT: Send users where they belong based on their role
        if (data.user.is_superuser) {
          navigate("/dashboard"); // Admin goes to Admin Command Center
        } else {
          navigate("/technician/requests"); // Technician goes to their assigned task dashboard
        }
      } else {
        setError(data.error || "Authentication failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      
      {/* LEFT SIDE: Branding / Visuals */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-slate-900 p-12 text-white relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600 rounded-full blur-[100px] opacity-20" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary rounded-full blur-[100px] opacity-20" />

        <div className="relative z-10 flex items-center gap-3">
          <img src={trinityLogo} alt="Trinity House" className="w-12 h-12 object-contain" />
          <span className="text-2xl font-black tracking-tight uppercase">Trinity House</span>
        </div>

        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ShieldCheck className="w-16 h-16 text-red-500 mb-6" />
            <h1 className="text-4xl font-black tracking-tight mb-4 leading-tight">
              Enterprise Operations <br /> <span className="text-red-500">Command Center</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Securely manage your inventory, role-based access, and organizational setups from one centralized dashboard.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 text-sm text-slate-500 font-medium">
          © {new Date().getFullYear()} Trinity House Project. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        
        {/* Mobile Logo (Visible only on small screens) */}
        <div className="absolute top-8 left-8 flex lg:hidden items-center gap-2">
          <img src={trinityLogo} alt="Trinity House" className="w-8 h-8 object-contain" />
          <span className="text-lg font-black tracking-tight uppercase text-slate-900">Trinity House</span>
        </div>

        <div className="w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100"
          >
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-slate-500 font-medium text-sm mb-8">
              {isLogin ? "Enter your credentials to access the dashboard." : "Register to get access to the command center."}
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold mb-6 border border-red-100 flex items-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  name="username"
                  placeholder="Username" 
                  value={formData.username}
                  onChange={handleChange}
                  className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white"
                  required
                />
              </div>

              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: "auto" }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1 relative"
                  >
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      name="email"
                      type="email"
                      placeholder="Email Address" 
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white"
                      required={!isLogin}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  name="password"
                  type="password"
                  placeholder="Password" 
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white"
                  required
                />
              </div>

              {isLogin && (
                <div className="flex justify-end pt-1">
                  <a href="#" className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors">
                    Forgot Password?
                  </a>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wide mt-4"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Sign In" : "Register")}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500 font-medium">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button 
                  onClick={() => { setIsLogin(!isLogin); setError(""); }}
                  className="text-red-600 font-bold hover:text-red-700 transition-colors uppercase ml-1"
                >
                  {isLogin ? "Create One" : "Sign In"}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}