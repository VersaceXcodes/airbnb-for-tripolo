import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const UV_Login: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isFocused, setIsFocused] = useState({
    username: false,
    password: false
  });

  const navigate = useNavigate();
  
  // Global store selectors
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  const errorMessage = useAppStore(state => state.authentication_state.error_message);
  const loginUser = useAppStore(state => state.login_user);
  const clearAuthError = useAppStore(state => state.clear_auth_error);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    
    try {
      await loginUser(usernameOrEmail, password);
      // Redirect based on user role after successful login
      // This will be handled by the App component based on authentication state
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Handle input focus
  const handleFocus = (field: 'username' | 'password') => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  // Handle input blur
  const handleBlur = (field: 'username' | 'password') => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
  };

  // Redirect if already authenticated
  if (isAuthenticated) {
    // In a real app, this would redirect based on user role
    // For now, we'll redirect to the guest dashboard
    navigate('/dashboard/guest');
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
          {/* Left Panel - Login Form */}
          <div className="md:w-1/2 p-8 sm:p-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">مرحباً بعودتك</h1>
              <p className="text-gray-600">سجل دخول لاستكمال رحلتك</p>
            </div>

            {errorMessage && (
              <div 
                className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                aria-live="polite"
              >
                {errorMessage}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label 
                  htmlFor="username-or-email" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  اسم المستخدم أو البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    id="username-or-email"
                    name="username-or-email"
                    type="text"
                    autoComplete="username"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => {
                      setUsernameOrEmail(e.target.value);
                      if (errorMessage) clearAuthError();
                    }}
                    onFocus={() => handleFocus('username')}
                    onBlur={() => handleBlur('username')}
                    aria-describedby="username-error"
                    className={`block w-full px-4 py-3 border ${
                      errorMessage 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors`}
                    dir="auto"
                  />
                  {isFocused.username && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) clearAuthError();
                    }}
                    onFocus={() => handleFocus('password')}
                    onBlur={() => handleBlur('password')}
                    aria-describedby="password-error"
                    className={`block w-full px-4 py-3 border ${
                      errorMessage 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors`}
                  />
                  {isFocused.password && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="mr-2 block text-sm text-gray-700">
                    تذكرني
                  </label>
                </div>

                <div className="text-sm">
                  <Link 
                    to="/forgot-password" 
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                    isLoading ? 'disabled:opacity-50 disabled:cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    'تسجيل الدخول'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    أو سجل الدخول باستخدام
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div>
                  <button
                    type="button"
                    disabled
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Sign in with Facebook</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div>
                  <button
                    type="button"
                    disabled
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Sign in with Google</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
                    </svg>
                  </button>
                </div>

                <div>
                  <button
                    type="button"
                    disabled
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Sign in with Twitter</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Registration Prompt */}
          <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-8 sm:p-12 flex flex-col justify-center">
            <div className="max-w-sm mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">مرحباً بك في TripoStay</h2>
              <p className="text-blue-100 mb-8 leading-relaxed">
                انضم إلى مجتمعنا وابدأ رحلتك في اكتشاف أماكن الإقامة المميزة في طرابلس
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold mb-3">لماذا تختار TripoStay؟</h3>
                <ul className="text-right space-y-3 text-blue-100">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-400 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>أسعار تنافسية بدون عمولة</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-400 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>تجربة استضافة أو ضيافة فريدة</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-400 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>تواصل آمن مع المضيفين والضيوف</span>
                  </li>
                </ul>
              </div>
              
              <div className="mt-8">
                <p className="mb-4 text-blue-100">ليس لديك حساب بعد؟</p>
                <Link
                  to="/register"
                  className="inline-block w-full py-3 px-6 border border-white rounded-lg text-white font-medium hover:bg-white hover:text-blue-600 transition-colors duration-300"
                >
                  إنشاء حساب جديد
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Login;