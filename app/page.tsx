"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Home/Navbar";
import Hero from "@/components/Home/Hero";
import TariffGrid from "@/components/Home/TariffGrid";
import ReviewSection from "@/components/Home/ReviewSection";
import BlogStream from "@/components/Home/BlogStream"; 
import Footer from "@/components/Home/Footer"; 
import AuthModal from "@/components/Modals/AuthModal";
import UpgradePlanModal from "@/components/Modals/UpgradePlanModal";
import { useAppStore } from "@/config/store";

export default function HomePage() {
  const { 
    isPricingVisible, 
    isReviewsVisible, 
    isUpgradeModalOpen, 
    setUpgradeModal, 
    initLanguage 
  } = useAppStore();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initLanguage(); 
    setMounted(true); 
  }, [initLanguage]);

  if (!mounted) {
    return <div className="min-h-screen w-full bg-neutral-950" />;
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-neutral-950 text-white overflow-x-hidden">
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <Navbar />

      <main className="flex-1 w-full relative z-10 flex flex-col items-center">
        <Hero />

        {isPricingVisible && (
          <div className="w-full border-t border-neutral-900 bg-neutral-950/20">
            <TariffGrid />
          </div>
        )}

        {isReviewsVisible && (
          <div className="w-full border-t border-neutral-900 bg-neutral-950/20">
            <ReviewSection />
          </div>
        )}

        <div className="w-full border-t border-neutral-900 bg-neutral-950/20">
          <BlogStream />
        </div>
      </main>

      <Footer />

      <AuthModal />
      
      <UpgradePlanModal 
        isOpen={isUpgradeModalOpen} 
        onCloseAction={() => setUpgradeModal(false)} 
      />

    </div>
  );
}
