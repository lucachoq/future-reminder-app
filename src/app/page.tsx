"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Bell, Clock, Mail, Phone, Calendar, CheckCircle, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isSignedIn, router]);

  if (isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="relative z-10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">LaterDate</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center space-x-4"
          >
            <SignInButton mode="modal">
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors">
                Get Started
              </button>
            </SignUpButton>
          </motion.div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
            >
              Never Miss
              <span className="text-blue-600"> Important</span>
              <br />
              Things Again
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-6 text-lg leading-8 text-gray-600"
            >
              Set reminders for the future and get notified via email, SMS, or call. 
              Perfect for canceling subscriptions, renewing documents, and staying on top of life&apos;s important moments.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-10 flex items-center justify-center gap-x-6"
            >
              <SignUpButton mode="modal">
                <button className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all duration-200 hover:scale-105">
                  Start for Free
                </button>
              </SignUpButton>
              <Link href="#features" className="text-lg font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors">
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-base font-semibold leading-7 text-blue-600"
            >
              Powerful Features
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            >
              Everything you need to stay organized
            </motion.p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col"
                >
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <feature.icon className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl lg:text-center"
          >
            <h2 className="text-base font-semibold leading-7 text-blue-600">Perfect For</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Common reminder scenarios
            </p>
          </motion.div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {useCases.map((useCase, index) => (
                <motion.div
                  key={useCase.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="text-sm font-semibold leading-6 text-gray-900">{useCase.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{useCase.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Join thousands of users who never miss important deadlines again.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <SignUpButton mode="modal">
                <button className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 transition-all duration-200 hover:scale-105">
                  Start for Free
                </button>
              </SignUpButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">LaterDate</span>
              </div>
              <p className="text-sm leading-6 text-gray-300">
                Never miss important things again with our future reminder app.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold leading-6 text-white">Product</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Features</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Pricing</a>
                    </li>
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm font-semibold leading-6 text-white">Support</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Help Center</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Contact</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24">
            <p className="text-xs leading-5 text-gray-400">
              &copy; 2024 LaterDate. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    name: 'Multiple Contact Methods',
    description: 'Get notified via email, SMS, or phone call. Choose what works best for you.',
    icon: Phone,
  },
  {
    name: 'Flexible Scheduling',
    description: 'Set reminders for specific dates or relative time periods (in X days/weeks/months).',
    icon: Calendar,
  },
  {
    name: 'Smart Persistence',
    description: 'Configure how persistent your reminders should be - from one-time to continuous until completed.',
    icon: Zap,
  },
  {
    name: 'Category Organization',
    description: 'Organize reminders by categories with smart emoji suggestions for better organization.',
    icon: CheckCircle,
  },
  {
    name: 'Recurring Reminders',
    description: 'Set up recurring reminders that repeat daily, weekly, or monthly until marked complete.',
    icon: Clock,
  },
  {
    name: 'Personalization',
    description: 'Add images, links, voice notes, and custom messages to make your reminders more personal.',
    icon: Mail,
  },
];

const useCases = [
  {
    title: 'Cancel Free Trials',
    description: 'Never forget to cancel those free trials before they charge you.',
  },
  {
    title: 'Renew Documents',
    description: 'Stay on top of health cards, car registrations, and other important renewals.',
  },
  {
    title: 'Library Returns',
    description: 'Return books on time and avoid late fees.',
  },
  {
    title: 'Birthday Wishes',
    description: 'Never miss sending birthday messages to friends and family.',
  },
  {
    title: 'Subscription Management',
    description: 'Keep track of all your subscriptions and renewal dates.',
  },
  {
    title: 'Health Appointments',
    description: 'Remember doctor appointments, dental checkups, and health screenings.',
  },
];
