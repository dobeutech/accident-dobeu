import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../stores/authStore';
import { useI18n, detectBrowserLanguage } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { ThemeSelector } from '../components/ui/ThemeSelector';
import { Truck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const { t, language, setLanguage } = useI18n();
  const { resolvedTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect browser language on mount
  useEffect(() => {
    const browserLang = detectBrowserLanguage();
    if (browserLang !== language) {
      setLanguage(browserLang);
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await login(data.email, data.password);
      toast.success(t('auth.welcome') + '!');
      navigate('/', { replace: true });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Invalid email or password';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Language and Theme selectors in top right */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <LanguageSelector compact />
        <ThemeSelector compact />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Truck className="w-10 h-10 text-white" aria-hidden="true" />
          </div>
        </div>
        <h1 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
          {t('app.name')}
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-slate-400">
          {t('app.tagline')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-sm rounded-xl sm:px-10 border border-gray-200 dark:border-slate-700">
          <h2 className="sr-only">{t('auth.signIn')}</h2>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            {error && (
              <div 
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-slate-300"
              >
                {t('auth.email')}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input"
                  placeholder="you@company.com"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-slate-300"
              >
                {t('auth.password')}
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input pr-10"
                  placeholder="••••••••"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
                {errors.password && (
                  <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-600 rounded dark:bg-slate-700"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 block text-sm text-gray-700 dark:text-slate-300"
                >
                  {t('auth.rememberMe')}
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#forgot-password"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus:outline-none focus:underline"
                >
                  {t('auth.forgotPassword')}
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-3 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div 
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" 
                    role="status"
                    aria-label="Signing in"
                  />
                ) : (
                  t('auth.signIn')
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-400">
          {t('auth.contactAdmin')}
        </p>
      </div>
    </div>
  );
}
