"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Globe,
  Zap,
  BarChart3,
  Shield,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-[200px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">IndexForge</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/login")}
            className="btn-secondary"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push("/login?mode=register")}
            className="btn-primary"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent-light text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Automated Backlink Indexing Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white via-white to-text-secondary bg-clip-text text-transparent">
              Submit. Index.
            </span>
            <br />
            <span className="bg-gradient-to-r from-accent via-accent-light to-purple-400 bg-clip-text text-transparent">
              Dominate Search.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
            Upload thousands of backlink URLs, auto-generate optimized sitemaps,
            and submit them to Google Search Console — all from one powerful dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push("/login?mode=register")}
              className="btn-primary text-lg px-8 py-4"
            >
              Start Indexing URLs
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push("/login")}
              className="btn-secondary text-lg px-8 py-4"
            >
              Sign In to Dashboard
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-32">
          {[
            {
              icon: Globe,
              title: "Bulk URL Upload",
              desc: "Upload 1,000–2,000 URLs per day via CSV or paste. Automatic deduplication included.",
              color: "from-blue-500 to-cyan-500",
            },
            {
              icon: Zap,
              title: "Auto Sitemaps",
              desc: "URLs auto-chunked into optimized XML sitemaps with a master index file.",
              color: "from-accent to-purple-500",
            },
            {
              icon: Shield,
              title: "GSC Integration",
              desc: "Direct submission to Google Search Console with retry logic and rate limiting.",
              color: "from-emerald-500 to-green-500",
            },
            {
              icon: BarChart3,
              title: "Live Tracking",
              desc: "Real-time dashboard with indexing rates, submission trends, and status tracking.",
              color: "from-orange-500 to-amber-500",
            },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className="glass-card p-6 fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-32 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { value: "2,000+", label: "URLs / Day" },
              { value: "250", label: "URLs / Sitemap" },
              { value: "24/7", label: "Auto Submission" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-8">
                <div className="text-4xl font-bold bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-text-secondary text-sm font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border-primary py-8 text-center text-text-muted text-sm">
        © {new Date().getFullYear()} IndexForge. Built for SEO professionals.
      </footer>
    </div>
  );
}
