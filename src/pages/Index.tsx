// src/pages/StudioPage.tsx

import React, { useEffect, useState } from 'react';
import { Loader2, Download, RotateCcw } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
// ✅ UI COMPONENTS
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/AppHeader';
import AfricanHairstyleGrid from '@/components/AfricanHairstyleGrid';
import LookbookSheet from '@/components/LookbookSheet';
import PricingModal from '@/components/PricingModal';
import HomePage from '@/components/HomePage';
import HistoryPage from '@/components/HistoryPage';
import MobileProfileHub from '@/components/MobileProfileHub';
import RewardsCenterModal from '@/components/RewardsCenterModal';
import RateAppModal from '@/components/RateAppModal';
import { PreGenerationSheet } from '@/components/PreGenerationSheet';
import { CustomStyleSheet } from '@/components/studio/CustomStyleSheet';
import { CameraCaptureOverlay } from '@/components/studio/CameraCaptureOverlay';

import { HairstyleGridSkeleton } from '@/components/skeletons';

// ✅ NEWLY EXTRACTED COMPONENTS
import { UploadState } from '@/components/studio/UploadState';
import { ProcessingState } from '@/components/studio/ProcessingState';
import { ReadyState } from '@/components/studio/ReadyState';
import { StyleCarousel } from '@/components/studio/StyleCarousel';
import { MobileActionBar } from '@/components/studio/MobileActionBar';
import ResultsViewer from '@/components/ResultsViewer';
import SavedLooksPage from '@/components/SavedLooksPage';
import { StudioStepper } from '@/components/studio/StudioStepper';
import { useStudioPageLogic } from '@/hooks/useStudioPageLogic';
import AuthModal from '@/components/AuthModal';
import { apiService } from '@/lib/api';

// ✅ STYLE-FIRST FLOW COMPONENTS
import PinterestFeed from '@/components/PinterestFeed';
import StyleDetailSheet from '@/components/StyleDetailSheet';
import ConfirmGenerateScreen from '@/components/ConfirmGenerateScreen';
import ResultsPreview from '@/dev/ResultsPreview';
import { PREVIEW } from '@/dev/previewFlag';
 

// --- MAIN COMPONENT ---

export default function StudioPage() {
  // ✅ All logic is now encapsulated in this single hook
  const {
    // State
    studioState,
    uploadMode,
    selectedPhoto,
    selectedHairstyle,
    showPricing,
    paywallContext,
    downloadLoading,
    showMobileGallery,
    showOnboarding,
    showAuthModal,
    showRewardsCenter,
    showPreGenerationSheet,
    
    // Derived State
    user,
    isAuthenticated,
    refreshUser,
    hairstyles,
    hairstylesLoading,
    isGenerating,
    generationId,
    generationStatus,
    progress,
    customThumbnailPath,
    customImageFile,
    activeShellTab,
    isMobileShellEnabled,

    // Handlers
    handleCloseOnboarding,
    showHelp,
    handlePhotoSelect,
    handleClearPhoto,
    handleHairstyleSelect,
    handleMobileHairstyleSelect,
    handleGenerateStyle,
    handleRequestGenerate,
    handleDismissPreGeneration,
    handleDownload,
    handlePurchase,
    handleTryAnother,
    handleRetrySameStyle,
    handleSignOutWithHaptic,
    handleDeleteAccount,
    setShowPricing,
    setShowMobileGallery,
    setShowAuthModal,
    setShowRewardsCenter,
    handleUploadHairstyle,
    generateCustomHairstyle,
    handleClearCustom,
    handleCustomStyleFAB,
    handleCustomStylePick,
    showCustomStyleSheet,
    setShowCustomStyleSheet,
    showCameraCapture,
    setShowCameraCapture,
    handleCameraCapture,
    showRateApp,
    setShowRateApp,
    
    // Style-first flow
    handleStyleFirstSelect,
    handleGoToDiscover,
    handleDiscoverUpload,
    
    // Navigation
    canGoBack,
    handleBack,
    handleShellNavigate,
  } = useStudioPageLogic();

  // Referral code for share feature
  const [referralCode, setReferralCode] = useState<string>('');
  // Style detail sheet state (for discover flow)
  const [styleDetailTarget, setStyleDetailTarget] = useState<any>(null);
  // Locked style tap state (for auth prompt)
  const [lockedStyleTap, setLockedStyleTap] = useState<any>(null);

  // Fetch referral code when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      apiService.getReferralInfo().then(result => {
        if (result.success && result.data.referralCode) {
          setReferralCode(result.data.referralCode);
        }
      });
    }
  }, [isAuthenticated]);

  // Page title effect remains here as it's a view concern
  useEffect(() => {
    document.title = 'Hair Studio - AI Hairstyle Try-On';
  }, []);

  // This renders the correct "view" based on the current state
  const renderStudioState = () => {
    switch (studioState) {
      case 'discover':
        return (
          <PinterestFeed
            onSelect={(hairstyle) => setStyleDetailTarget(hairstyle)}
            seed={hairstyles}
          />
        ); 
      case 'upload':
        return (
          <UploadState
            uploadMode={uploadMode}
            selectedPhoto={selectedPhoto}
            isAuthenticated={isAuthenticated}
            selectedHairstyle={selectedHairstyle}
            onPhotoSelect={handlePhotoSelect}
            onClearPhoto={handleClearPhoto}
            onStyleSelect={handleHairstyleSelect}
            onBack={handleBack}
          />
        );
      case 'processing':
        return (
          selectedPhoto && (
            <ProcessingState
              selectedPhoto={selectedPhoto}
              selectedHairstyle={selectedHairstyle}
              progress={progress}
            />
          )
        );
      case 'results':
        return (
          <ResultsViewer
            selectedPhoto={selectedPhoto}
            generationStatus={generationStatus}
            generationId={generationId}
            selectedHairstyle={selectedHairstyle}
            referralCode={referralCode}
            isPro={user?.isPro || false}
            isGuest={user?.isGuest || false}
            availableCredits={user?.credits}
            onTryAnother={handleTryAnother}
            onRetrySameStyle={handleRetrySameStyle}
            onShowPricing={() => setShowPricing(true)}
            onShowRewards={() => setShowRewardsCenter(true)}
            onShowAuth={() => setShowAuthModal(true)}
          />
        );
      case 'ready':
      default:
        // If photo + style both exist, show confirm & generate screen
        if (selectedPhoto && selectedHairstyle) {
          return (
            <ConfirmGenerateScreen
              selectedPhoto={selectedPhoto}
              selectedHairstyle={selectedHairstyle}
              userCredits={user?.credits || 0}
              isPro={user?.isPro || false}
              isAuthenticated={isAuthenticated}
              onGenerate={handleGenerateStyle}
              onBack={handleBack}
              onBuyCredits={() => setShowPricing(true)}
            />
          );
        }
        // If only photo exists (no style), show the old ready state
        return (
          selectedPhoto && (
            <>
              <ReadyState
                selectedPhoto={selectedPhoto}
                selectedHairstyle={selectedHairstyle}
                isAuthenticated={isAuthenticated}
                onClearPhoto={handleClearPhoto}
                userCredits={user?.credits || 0}
                isPro={user?.isPro || false}
              />
              <StyleCarousel
                hairstyles={hairstyles}
                selectedId={selectedHairstyle?.id}
                onSelect={handleHairstyleSelect}
                isLoading={hairstylesLoading}
              />
              {/* Bottom padding for action bar */}
              <div className="h-24" />
            </>
          )
        );
    }
  };

  // Bottom tab bar removed: the browse feed is full-bleed and navigation now
  // lives in the header menu sheet.
  const showBottomNavigation = false;
  const showTryOnSurface = !isMobileShellEnabled || activeShellTab === 'try-on';
  const isDiscoverState = studioState === 'discover';
  const isConfirmScreen = studioState === 'ready' && !!selectedPhoto && !!selectedHairstyle;

  const renderMainSurface = () => {
    // DEV-only: mount the results screen with fixtures. Generation is down
    // app-wide (Gemini billing) so there is otherwise no way to reach it in the
    // browser. Stripped from production builds by import.meta.env.DEV.
    if (import.meta.env.DEV && PREVIEW === 'results') {
      return <ResultsPreview />;
    }

    if (showTryOnSurface) {
      return renderStudioState();
    }

    if (activeShellTab === 'looks') {
      return (
        <SavedLooksPage
          embedded
          onShowAuth={() => setShowAuthModal(true)}
          onStartTryOn={() => handleShellNavigate('try-on')}
        />
      );
    }

    return (
      <MobileProfileHub
        user={user}
        isAuthenticated={isAuthenticated}
        onOpenPaywall={() => setShowPricing(true)}
        onOpenRewards={() => setShowRewardsCenter(true)}
        onShowHelp={showHelp}
        onShowAuth={() => setShowAuthModal(true)}
        onSignOut={() => void handleSignOutWithHaptic()}
        onNavigateToStudio={() => handleShellNavigate('try-on')}
        refreshUser={refreshUser}
      />
    );
  };

  return (
    <div id="main-content" className="min-h-[100dvh] h-[100dvh] bg-surface flex flex-col overflow-hidden">
      {/* Onboarding carousel removed (zero-screen onboarding — users land in the
          lookbook and learn by doing). The header ternary that used to sit here
          rendered the SAME component in both branches, so it collapsed to one. */}
      <AppHeader
        user={user}
        isAuthenticated={isAuthenticated}
        setShowPricing={setShowPricing}
        onShowAuth={() => setShowAuthModal(true)}
        onOpenSearch={() => setShowMobileGallery(true)}
        onNavigate={handleShellNavigate}
        onOpenRewards={() => setShowRewardsCenter(true)}
        onSignOut={handleSignOutWithHaptic}
      />

    

<AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
  onSuccess={() => setShowAuthModal(false)}
        title="Sign in to Continue"
        description="Sign in to choose any hairstyles"
        showProBenefits={false}
      />

      {/* Auth modal for locked style taps — credits variant for first-timers, default for returning */}
      <AuthModal
        isOpen={!!lockedStyleTap}
        onClose={() => setLockedStyleTap(null)}
        onSuccess={() => setLockedStyleTap(null)}
        variant={localStorage.getItem('has_signed_in') ? 'default' : 'credits'}
        title={localStorage.getItem('has_signed_in') ? 'Sign in to unlock' : undefined}
        description={localStorage.getItem('has_signed_in') ? `Sign in to try ${lockedStyleTap?.name || 'this style'}` : undefined}
        hairstyleThumbnail={lockedStyleTap?.thumbnail}
        hairstyleName={lockedStyleTap?.name}
      />


      <div className="flex-1 flex overflow-hidden">
        {/* Main Content - Single scroll container on mobile */}
        <main className="flex-1 flex flex-col overflow-hidden overscroll-contain">
          {isDiscoverState && showTryOnSurface ? (
            /* Discover state: full-bleed style browsing */
            <div className={`flex-1 overflow-hidden ${showBottomNavigation ? 'pb-[var(--mobile-tabbar-height)]' : ''}`}>
              {renderMainSurface()}
            </div>
          ) : (
            /* Other states: centered content */
            <div className={`flex-1 ${studioState === 'upload' ? 'px-3' : ''} overflow-y-auto lg:overflow-y-auto`}>
              <div className={`flex items-start justify-center ${studioState !== 'results' && 'p-1'} sm:p-8 lg:items-center ${showBottomNavigation && showTryOnSurface ? 'pb-[calc(var(--bottom-total)+var(--mobile-tabbar-height))]' : showBottomNavigation ? 'pb-[var(--mobile-tabbar-height)]' : 'pb-[var(--bottom-total)]'} lg:pb-4 min-h-full`}>
                <div className="w-full max-w-2xl">
                  {renderMainSurface()}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Desktop Sidebar - Hairstyle Gallery */}
        <div className={`hidden lg:block ${showTryOnSurface ? '' : 'lg:hidden'}`}>
          {hairstylesLoading ? (
            <div className="w-70 bg-white border-l border-gray-200">
              <HairstyleGridSkeleton count={9} columns={3} />
            </div>
          ) : (
            <AfricanHairstyleGrid
              onHairstyleSelect={handleHairstyleSelect}
              selectedHairstyle={selectedHairstyle}
              userCredits={user?.credits || 0}
              hairstyles={hairstyles}
              handleGenerateStyle={handleRequestGenerate}
              setShowPricing={setShowPricing}
              handleUploadHairstyle={handleUploadHairstyle}
            />
          )}
        </div>
      </div>

      {/* Mobile Action Bar - hidden during discover (has its own CTA), the
          confirm screen (has its own Generate), and results (M4 §6.1: the
          result screen is full-bleed and carries its own floating actions). */}
      {showTryOnSurface && !isDiscoverState && !isConfirmScreen && studioState !== 'results' && (
        <MobileActionBar
          studioState={studioState}
          selectedHairstyle={selectedHairstyle}
          isGenerating={isGenerating}
          downloadLoading={downloadLoading}
          onDownload={handleDownload}
          onTryAnother={handleTryAnother}
          onGenerate={handleRequestGenerate}
          isAuthenticated={isAuthenticated}
          canGoBack={canGoBack}
          onBack={handleBack}
          onShowGallery={() => setShowMobileGallery(true)}
          handleUploadHairstyle={handleUploadHairstyle}
          generateCustomHairstyle={generateCustomHairstyle}
          customThumbnailPath={customThumbnailPath}
          customImageFile={customImageFile}
          handleClearCustom={handleClearCustom}
        />
      )}


      {/* Modals */}
      {/* Full browse surface — one sheet with chip filters + infinite grid,
          replacing the 494-line MobileHairstyleModal. */}
      {showMobileGallery && (
        <LookbookSheet
          isOpen={showMobileGallery}
          onClose={() => setShowMobileGallery(false)}
          onSelect={handleMobileHairstyleSelect}
          seed={hairstyles}
        />
      )}

      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        onOpenRewards={() => setShowRewardsCenter(true)}
        context={paywallContext}
      />

      <RewardsCenterModal
        isOpen={showRewardsCenter}
        onClose={() => setShowRewardsCenter(false)}
        onOpenPaywall={() => setShowPricing(true)}
      />

      <RateAppModal
        isOpen={showRateApp}
        onClose={() => setShowRateApp(false)}
      />

      {/* Pre-generation cost visibility sheet */}
      {showPreGenerationSheet && selectedHairstyle && (
        <PreGenerationSheet
          hairstyleName={selectedHairstyle.name || 'Selected Style'}
          hairstyleId={selectedHairstyle._id || selectedHairstyle.id}
          creditCost={selectedHairstyle.price || 1}
          userCredits={user?.credits || 0}
          isPro={!!user?.subscription?.status && user.subscription.status === 'active'}
          isAuthenticated={isAuthenticated}
          onConfirm={handleGenerateStyle}
          onCancel={handleDismissPreGeneration}
          onBuyCredits={() => {
            handleDismissPreGeneration();
            setShowPricing(true);
          }}
        />
      )}

      {/* Custom style upload source picker */}
      <CustomStyleSheet
        isOpen={showCustomStyleSheet}
        onClose={() => setShowCustomStyleSheet(false)}
        onCamera={() => handleCustomStylePick('camera')}
        onGallery={() => handleCustomStylePick('gallery')}
      />

      {/* Web camera capture for custom style photos */}
      <CameraCaptureOverlay
        isOpen={showCameraCapture}
        onClose={() => setShowCameraCapture(false)}
        onCapture={handleCameraCapture}
      />

      {/* Style Detail Sheet — shown when tapping a style from discover */}
      {styleDetailTarget && (
        <StyleDetailSheet
          hairstyle={styleDetailTarget}
          onTryStyle={(hairstyle) => {
            setStyleDetailTarget(null);
            handleStyleFirstSelect(hairstyle);
          }}
          onClose={() => setStyleDetailTarget(null)}
          userCredits={user?.credits || 0}
          onBuyCredits={() => {
            setStyleDetailTarget(null);
            setShowPricing(true);
          }}
        />
      )}
    </div>
  );
}