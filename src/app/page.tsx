'use client';
import { useState, useEffect } from "react";
import { Eye, EyeOff, User, Lock, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { translations } from "../../components/translations/login";

export default function ProfessionalLogin() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [lang, setLang] = useState<"es" | "en" | "fr">("en");
  const t = translations[lang];

  const router = useRouter();

  // Al montar, cargar idioma guardado
  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    if (savedLang === "es" || savedLang === "en" || savedLang === "fr") {
      setLang(savedLang);
    }
  }, []);

  // Guardar idioma cuando cambie
  const handleLangChange = (value: "es" | "en" | "fr") => {
    setLang(value);
    localStorage.setItem("lang", value);
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      email: formData.email,
      password: formData.password,
    });
    setIsLoading(false);

    if (res && res.ok) {
      router.push("/dashboard");
    } else {
      setError(t.wrongCredentials);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-red-700/30 p-8">

          {/* Selector de idioma */}
          <div className="absolute top-4 right-4">
            <select value={lang} onChange={e => handleLangChange(e.target.value as any)} className="border rounded p-1">
              <option value="es">ES</option>
              <option value="en">EN</option>
              <option value="fr">FR</option>
            </select>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-xl mb-4 shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-red-900 mb-2">{t.welcome}</h1>
            <p className="text-red-400">{t.loginMessage}</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-red-400">
                {t.emailLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-red-300" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-red-300 rounded-lg bg-red-50/50"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-red-400">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-red-300" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-red-300 rounded-lg bg-red-50/50"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Recordarme / olvidé */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-red-300" />
                <span className="ml-2 text-red-400">{t.rememberMe}</span>
              </label>
              <button type="button" className="text-yellow-500">
                {t.forgotPassword}
              </button>
            </div>

            {/* Botón */}
            <button type="submit" disabled={isLoading} className="w-full bg-yellow-600 text-white py-3 rounded-lg">
              {isLoading ? t.signingIn : t.signIn}
            </button>
          </form>

          {/* Credenciales demo */}
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600 font-medium mb-2">{t.demoCredentials}</p>
            <p className="text-xs text-green-500">
              user@example.com<br />password123
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-red-400">
              {t.noAccount}{" "}
              <button className="text-yellow-500">{t.registerHere}</button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
