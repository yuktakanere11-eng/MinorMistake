import React from 'react';
import { Link } from 'react-router-dom'; // Assuming standard React Router setup

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-violet-100 selection:text-violet-900">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">MinorMistake</span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-slate-900 transition-colors">Testimonials</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#about" className="hover:text-slate-900 transition-colors">About</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Log in
            </Link>
            <Link to="/signup" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 transition-all focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-24 pb-32">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500"></span>
            </span>
            Introducing AI-Powered Feedback Workflows
          </div>

          {/* Headlines */}
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl">
            Review Student Work Faster with <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">AI-Assisted Feedback</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
            MinorMistake transforms how educators grade. Get consistent, high-quality feedback in a fraction of the time. Powered by AI, perfected by you.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/signup" className="flex w-full items-center justify-center rounded-lg bg-violet-600 px-8 py-3.5 text-sm font-medium text-white shadow-sm hover:bg-violet-700 transition-all sm:w-auto">
              Start Free Trial
            </Link>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-white border border-slate-200 px-8 py-3.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all sm:w-auto">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch Demo
            </button>
          </div>

          {/* Social Proof */}
          <div className="mt-8 flex items-center justify-center gap-3 text-sm text-slate-500">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200" />
              ))}
            </div>
            <p>Join 10,000+ teachers saving hours each week</p>
          </div>

          {/* Hero Image / Dashboard Preview */}
          <div className="relative mx-auto mt-20 max-w-5xl">
            {/* Subtle Glow Effect */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 opacity-70 blur-2xl"></div>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-slate-200/50 bg-slate-50 shadow-2xl ring-1 ring-slate-900/5">
              <div className="flex h-12 w-full items-center border-b border-slate-200/60 bg-white/50 px-4 backdrop-blur-sm">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400"></div>
                  <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                </div>
              </div>
              <div className="flex h-full items-center justify-center text-slate-400 font-medium">
                AI Feedback Dashboard Preview
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-sm font-semibold tracking-wide text-violet-600 uppercase">Features</h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Everything You Need to Provide Better Feedback
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              Powerful tools designed specifically for educators to streamine the grading process without sacrificing quality.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <div key={idx} className="group rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5 hover:shadow-md transition-all">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-${feature.color}-50 text-${feature.color}-600`}>
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THREE SIMPLE STEPS */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold tracking-wide text-violet-600 uppercase">How It Works</h2>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Three Simple Steps to Better Feedback
          </p>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, idx) => (
              <div key={idx} className="relative flex flex-col items-center p-6 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 text-2xl font-bold text-white shadow-lg shadow-violet-600/20">
                  {idx + 1}
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ALTERNATING BENEFITS */}
      <section className="bg-slate-50 py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-sm font-semibold tracking-wide text-violet-600 uppercase">Benefits</h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Why Teachers Love MinorMistake
            </p>
          </div>

          {/* Block 1 */}
          <div className="grid items-center gap-16 lg:grid-cols-2 mb-24">
            <div className="aspect-[4/3] rounded-2xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 font-medium shadow-inner">
              Teacher Dashboard View
            </div>
            <div>
              <h3 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">Save Time, Reduce Burnout</h3>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Spend less time grading and more time teaching. Our AI handles the heavy lifting, allowing you to focus on what matters most: your students.
              </p>
              <ul className="space-y-4">
                {['75% faster feedback generation', 'Eliminate repetitive grading tasks', 'Identify class-wide trends instantly'].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-700">
                    <svg className="mr-3 h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Block 2 */}
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <h3 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">Better Learning Outcomes</h3>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Provide more detailed, personalized feedback to every student. MinorMistake helps you pinpoint areas for improvement and guide students to success.
              </p>
              <ul className="space-y-4">
                {['Actionable, clear advice for students', 'Consistent grading across classes', 'Promotes independent learning'].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-700">
                    <svg className="mr-3 h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 aspect-[4/3] rounded-2xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 font-medium shadow-inner lg:order-2">
              Student Performance View
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Loved by Teachers Worldwide
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((test, idx) => (
              <div key={idx} className="flex flex-col justify-between rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5">
                <div>
                  <div className="mb-4 flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-slate-700 leading-relaxed">"{test.quote}"</p>
                </div>
                <div className="mt-8 flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-${test.color}-100 text-${test.color}-700 font-bold`}>
                    {test.initials}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{test.name}</h4>
                    <p className="text-sm text-slate-500">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold tracking-wide text-violet-600 uppercase">Pricing</h2>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Simple, Transparent Pricing
          </p>
          <p className="mt-4 text-lg text-slate-500 mb-12">
            Focus on teaching, not budgeting. One plan, all features.
          </p>

          <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-900/5 sm:p-10 flex flex-col md:flex-row items-center text-left gap-8">
            <div className="w-full md:w-1/2">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro Plan</h3>
              <p className="text-slate-500 mb-6">Everything you need to scale your grading workflow.</p>
              <div className="mb-6 flex items-baseline text-5xl font-extrabold text-slate-900">
                $15
                <span className="ml-1 text-xl font-medium text-slate-500">/mo</span>
              </div>
              <Link to="/signup" className="block w-full rounded-lg bg-violet-600 px-6 py-4 text-center text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition-all">
                Get Started Today
              </Link>
            </div>
            <div className="w-full md:w-1/2">
              <ul className="space-y-4">
                {['Unlimited student uploads', 'Advanced AI grading models', 'Custom rubric creation', 'Data export & analytics', '24/7 priority support'].map((feature, idx) => (
                  <li key={idx} className="flex items-center text-slate-700">
                    <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-violet-600 py-20 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
           <div className="absolute -top-[20%] -left-[10%] w-[50%] aspect-square rounded-full bg-white blur-3xl"></div>
           <div className="absolute -bottom-[20%] -right-[10%] w-[50%] aspect-square rounded-full bg-violet-900 blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to Transform Your Feedback Process?
          </h2>
          <p className="mt-4 text-lg text-violet-100 mb-8">
            Join the forward-thinking educators saving time and improving student outcomes.
          </p>
          <Link to="/signup" className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-bold text-violet-600 shadow-lg hover:bg-slate-50 hover:scale-105 transition-all">
            Start Your Free Trial Now
          </Link>
          <p className="mt-4 text-sm text-violet-200">No credit card required. Cancel anytime.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 py-12 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-2">
              <span className="text-xl font-bold text-white tracking-tight mb-4 block">MinorMistake</span>
              <p className="text-sm leading-relaxed mb-6 max-w-xs">
                Empowering educators with AI-driven tools to provide faster, better, and more personalized student feedback.
              </p>
              <div className="flex gap-4">
                {/* Social Placeholders */}
                <div className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"></div>
                <div className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"></div>
                <div className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"></div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
            <p>&copy; 2026 MinorMistake. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- DATA ARRAYS (Keep outside component to prevent re-creation on render) ---

const features = [
  {
    title: "AI-Powered Feedback",
    desc: "Instantly generate detailed, actionable feedback tailored to specific rubrics and student needs.",
    color: "violet",
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  },
  {
    title: "Customizable Rubrics",
    desc: "Import existing rubrics or create new ones to ensure feedback aligns with your curriculum.",
    color: "amber",
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
  },
  {
    title: "Seamless Integration",
    desc: "Works alongside your existing LMS tools to create a frictionless grading experience.",
    color: "blue",
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
  },
  {
    title: "Save Hours Every Week",
    desc: "Drastically reduce grading time while maintaining or improving the quality of feedback.",
    color: "green",
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  {
    title: "Class Trend Analysis",
    desc: "Identify common mistakes across the classroom to adjust future lesson plans effectively.",
    color: "violet",
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
  },
  {
    title: "Plagiarism Detection",
    desc: "Built-in originality checks ensure academic integrity without needing separate software.",
    color: "rose",
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
  }
];

const steps = [
  { title: "Upload Student Work", desc: "Easily upload essays, code, or assignments in bulk directly from your computer or LMS." },
  { title: "AI Generates Feedback", desc: "Our engine reviews the work against your rubrics, drafting detailed, constructive feedback." },
  { title: "Review & Send", desc: "You have the final say. Edit the feedback, add a personal touch, and send it to students." }
];

const testimonials = [
  {
    quote: "MinorMistake has completely changed my weekends. I used to spend hours grading; now I review AI suggestions and I'm done in half the time.",
    name: "Sarah Jenkins",
    role: "High School English Teacher",
    initials: "SJ",
    color: "violet"
  },
  {
    quote: "The consistency in grading is incredible. My students appreciate the detailed feedback, and I appreciate getting my evenings back.",
    name: "Dr. Mark Riker",
    role: "University Professor",
    initials: "MR",
    color: "blue"
  },
  {
    quote: "It's like having a dedicated teaching assistant. The trend analysis feature lets me know exactly what to cover in tomorrow's lecture.",
    name: "Emily Chen",
    role: "Middle School Science",
    initials: "EC",
    color: "emerald"
  }
];