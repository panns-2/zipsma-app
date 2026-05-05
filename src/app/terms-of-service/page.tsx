
"use client";
import Link from 'next/link';
import { ZipSMALogo } from '@/components/zipsma-logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, FileText, Globe, Scale } from 'lucide-react';

export default function TermsOfService() {
  const lastUpdated = "October 15, 2023";

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Simple Header */}
      <header className="bg-white border-b py-4 sticky top-0 z-50">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <ZipSMALogo className="w-8 h-8 invert brightness-0" />
            <span className="text-xl font-bold font-headline">ZipSMA</span>
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/"><ArrowLeft className="mr-2 w-4 h-4" /> Back to Home</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100">
          <div className="flex items-center gap-4 mb-8 text-primary">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Scale className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black font-headline">Terms of Service</h1>
              <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
            </div>
          </div>

          <div className="prose prose-blue max-w-none space-y-8 text-gray-700">
            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the ZipSMA platform, you agree to be bound by these Terms of Service. If you are using the service on behalf of a school or educational institution, you represent that you have the authority to bind that institution to these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">2. Description of Service</h2>
              <p>
                ZipSMA provides a comprehensive School Management Application designed for educational institutions in Ghana and West Africa. Services include student records management, financial tracking, academic reporting, and AI-powered educational assistants aligned with NaCCA/GES standards.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">3. User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Security:</strong> Users are responsible for maintaining the confidentiality of their login credentials, including Admin PINs.</li>
                <li><strong>Data Accuracy:</strong> Schools are responsible for ensuring that all student and financial data entered into the system is accurate and compliant with local educational regulations.</li>
                <li><strong>Ethical Use of AI:</strong> AI-generated content (lesson plans, remarks) should be reviewed by qualified educators before implementation.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">4. Data Privacy & Security</h2>
              <p>
                Your use of ZipSMA is also governed by our Privacy Policy. We implement industry-standard security measures to protect sensitive student and financial data. For more details, please refer to our <Link href="/privacy-policy" className="text-primary hover:underline font-semibold">Privacy Policy</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">5. Fees and Payments</h2>
              <p>
                Schools agree to pay the fees associated with their selected plan. ZipSMA uses third-party payment processors (e.g., Paystack). All financial transactions within the app (school fee payments) are between the school and the parents; ZipSMA acts only as a facilitator and record-keeper.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">6. Intellectual Property</h2>
              <p>
                ZipSMA and its original content, features, and functionality are and will remain the exclusive property of ZipSMA. The software is provided on a subscription basis and is not "sold" to the user.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">7. Termination</h2>
              <p>
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </section>

            <section className="bg-primary/5 p-6 rounded-2xl border border-primary/10 mt-12">
              <h2 className="text-lg font-bold text-primary mb-2">Contact Us</h2>
              <p className="text-sm">
                If you have any questions about these Terms, please contact our legal team at: 
                <br />
                <span className="font-bold">legal@zipsma.com</span>
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t py-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} ZipSMA. Supporting Education in West Africa.</p>
      </footer>
    </div>
  );
}
