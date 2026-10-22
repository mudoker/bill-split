'use client';

import { useState, useEffect } from 'react';
import { ItemsSection } from "@/components/items/items-section";
import { PeopleSection } from "@/components/people/people-section";
import { SummarySection } from "@/components/summary/summary-section";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Users, Receipt, CreditCard, ArrowLeft, MapPin, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBillStore } from "@/store/useBillStore";
import { deserializeState } from "@/lib/share";
import { Eye } from "lucide-react";
import { LandingPage } from "@/components/layout/landing-page";
import { BillConfiguration } from "@/components/summary/bill-configuration";
import { DiscrepancyBanner } from "@/components/shared/discrepancy-banner";
import { IS_DEV } from "@/lib/env";
import { AppLogo } from "@/components/shared/app-logo";
import { CreateBillModal, type CreateBillFormData } from "@/components/shared/create-bill-modal";
import { ResizableSplit } from "@/components/layout/resizable-split";

function App() {
  const [view, setView] = useState<'landing' | 'editor' | 'summary'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('id') || params.get('v') || params.get('e')) {
        return 'editor';
      }
    }
    return 'landing';
  });
  const [mobileTab, setMobileTab] = useState<'people' | 'items' | 'summary'>('items');
  const [isReadOnlyModalOpen, setIsReadOnlyModalOpen] = useState(false);
  const {
    isReadOnly,
    isHydrated,
    loadState,
    saveToDb,
    fetchBill,
    people,
    items,
    globalCharges,
    hostId,
    currentBillId,
    resetBill,
    fetchHistory,
    setHostId,
    addGlobalCharge,
    updateGlobalCharge,
    removeGlobalCharge,
    billName,
    location,
    setBillName,
    setLocation,
    updatePerson,
    qrCode,
    setQrCode,
    currency,
    setCurrency
  } = useBillStore();

  // Handle URL parameters (Legacy v/e and New id)
  useEffect(() => {
    if (!isHydrated) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const viewData = params.get('v');
    const editData = params.get('e');

    if (id || viewData || editData) {
      if (id) {
        fetchBill(id);
      } else if (viewData || editData) {
        const state = deserializeState(viewData || editData || '');
        if (state) {
          loadState(state, !!viewData);
        }
      }
    }
  }, [isHydrated, loadState, fetchBill]);

  // Auto-save logic
  useEffect(() => {
    if (!isHydrated || isReadOnly) return;

    // Only auto-save if there's actual data
    if (people.length === 0 && items.length === 0) return;

    const timer = setTimeout(() => {
      saveToDb();
    }, 2000); // 2 second delay for debounced auto-save

    return () => clearTimeout(timer);
  }, [people, items, globalCharges, hostId, isHydrated, isReadOnly, saveToDb, view]);

  const handleBackToLanding = async () => {
    if (!isReadOnly && (people.length > 0 || items.length > 0)) {
      await saveToDb();
    }
    // Clear URL params without reload
    window.history.pushState({}, '', window.location.origin);
    await fetchHistory();
    setView('landing');
  };

  const handleStartNewBill = (data?: CreateBillFormData) => {
    resetBill();
    if (data?.currency) {
      setCurrency(data.currency);
    }
    const cleanName = data?.name?.trim() || 'New Bill';
    setBillName(cleanName);
    if (data?.location?.trim()) {
      setLocation(data.location.trim());
    }
    if (data?.hostName?.trim()) {
      const hostId = crypto.randomUUID();
      useBillStore.setState({
        people: [
          { id: hostId, name: data.hostName.trim(), sponsorAmount: 0, paidAmount: 0 },
        ],
        hostId: hostId,
      });
    }
    useBillStore.getState().setHydrated(true);
    setView('editor');
  };

  const handleSelectBill = (id: string | 'current') => {
    if (id === 'current') {
      setView('editor');
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('id', id);
    window.history.pushState({}, '', url.toString());
    fetchBill(id);
    setView('editor');
  };

  if (!isHydrated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <AppLogo className="w-12 h-12 text-primary/40" />
          <div className="h-2 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className={cn(
        "min-h-screen bg-background font-sans text-foreground antialiased selection:bg-foreground/20 flex flex-col items-stretch",
        view === 'landing' ? "min-h-[100dvh] overflow-y-auto" : "h-screen supports-[height:100dvh]:h-[100dvh] overflow-hidden"
      )}>

        {view === 'landing' ? (
          <>
            <div className="flex-none px-4 sm:px-6 md:px-8 lg:px-10 pt-[max(1rem,env(safe-area-inset-top))] md:pt-6 w-full max-w-[94%] 2xl:max-w-[2000px] mx-auto">
              <header className="flex justify-between items-center">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="p-2 bg-foreground rounded-xl shadow-lg shadow-black/10">
                    <AppLogo className="w-5 h-5 sm:w-6 sm:h-6 text-background" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    Bill Split
                  </h1>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <a
                    href="https://github.com/mudoker/bill-split"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View GitHub repository"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 h-9 rounded-xl border-foreground/10 hover:bg-foreground/5 font-bold transition-all text-xs"
                    >
                      <Github className="w-4 h-4" />
                      <span className="hidden sm:inline">GitHub</span>
                    </Button>
                  </a>
                  <ModeToggle />
                </div>
              </header>
            </div>
            <LandingPage
              onNewBill={handleStartNewBill}
              onSelectBill={handleSelectBill}
              onLoadDemo={IS_DEV ? async () => {
                // Create a new demo bill via the API, then load it by id
                const res = await fetch('/api/bills', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    data: {
                      name: 'Demo Bill',
                      location: 'Demo Location',
                      people: [
                        { id: crypto.randomUUID(), name: 'Alice', sponsorAmount: 0, paidAmount: 1000 },
                        { id: crypto.randomUUID(), name: 'Bob', sponsorAmount: 0, paidAmount: 2000 }
                      ],
                      items: [
                        { id: crypto.randomUUID(), name: 'Pizza', price: 1500, quantity: 2, assignments: {} },
                        { id: crypto.randomUUID(), name: 'Soda', price: 500, quantity: 3, assignments: {} }
                      ],
                      globalCharges: [
                        { id: crypto.randomUUID(), name: 'Service', amount: 10, type: 'percent' }
                      ],
                      hostId: null,
                      qrCode: null
                    }
                  })
                });
                const result = await res.json();
                if (result.id) {
                  await fetchBill(result.id);
                  setView('editor');
                }
              } : undefined}
            />
          </>
        ) : (
          <>
            {isReadOnly && (
              <div className="bg-foreground/5 border-b border-foreground/10 py-2 px-3 sm:px-4 flex items-center justify-center gap-2 sm:gap-3 animate-in slide-in-from-top duration-300 flex-none text-[11px] sm:text-xs">
                <Eye className="w-3.5 h-3.5 text-foreground/60 shrink-0" />
                <span className="font-semibold text-foreground uppercase tracking-wider truncate">View-only Mode - Changes disabled</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 sm:h-7 text-[10px] ml-2 hover:bg-foreground/5 px-2"
                  onClick={() => setIsReadOnlyModalOpen(true)}
                >
                  New Bill
                </Button>
              </div>
            )}

            <CreateBillModal
              open={isReadOnlyModalOpen}
              onOpenChange={setIsReadOnlyModalOpen}
              onSubmit={handleStartNewBill}
            />

              {/* Header - Fixed & Safe-Area Aware */}
              <div className="flex-none px-3 sm:px-6 md:px-8 lg:px-10 pt-[max(0.625rem,env(safe-area-inset-top))] sm:pt-4 md:pt-6 w-full max-w-[94%] 2xl:max-w-[2000px] mx-auto">
                <header className="flex justify-between items-center mb-2 sm:mb-3 md:mb-5 gap-1.5 sm:gap-3">
                  <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
                    <Button variant="ghost" size="icon" onClick={handleBackToLanding} className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl shrink-0 touch-manipulation active:scale-95" title="Back to Bills">
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      <div className="hidden xs:flex p-1.5 sm:p-2 bg-foreground rounded-xl shadow-lg shadow-black/10 shrink-0">
                        <AppLogo className="w-4 h-4 sm:w-5 sm:h-5 text-background" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <h1 className="text-sm sm:text-lg md:text-xl font-black tracking-tight text-foreground truncate" title={billName || "Untitled Bill"}>
                            {billName || "Untitled Bill"}
                          </h1>
                          <span className="hidden md:inline-flex text-[9px] text-muted-foreground border border-foreground/10 uppercase font-black tracking-[0.2em] bg-foreground/5 px-2 py-0.5 rounded-full shrink-0">
                            {currentBillId ? `SESSION ${currentBillId.slice(0, 8)}` : "LIVE SESSION"}
                          </span>
                        </div>
                        {location && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 font-medium truncate mt-0.5">
                            <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{location}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {/* Compact Currency Switcher for Mobile */}
                    <button
                      type="button"
                      onClick={() => setCurrency(currency === 'VND' ? 'USD' : 'VND')}
                      className="sm:hidden h-8 px-2 rounded-xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/10 text-xs font-black transition-all flex items-center gap-1 text-foreground touch-manipulation active:scale-95 shadow-sm"
                      title={`Current currency: ${currency}. Tap to switch to ${currency === 'VND' ? 'USD ($)' : 'VND (₫)'}`}
                    >
                      <span className="font-black text-xs text-primary">{currency === 'VND' ? '₫' : '$'}</span>
                      <span className="text-[10px] opacity-70 uppercase tracking-tighter">{currency}</span>
                    </button>

                    {/* Segmented Currency Switcher for Tablet / Desktop */}
                    <div className="hidden sm:flex items-center bg-foreground/[0.04] p-0.5 rounded-xl border border-foreground/10 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setCurrency('VND')}
                        className={cn(
                          "px-2 sm:px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1",
                          currency === 'VND'
                            ? "bg-foreground text-background shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        title="Switch to Vietnamese Dong (₫)"
                      >
                        <span>₫</span>
                        <span>VND</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency('USD')}
                        className={cn(
                          "px-2 sm:px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1",
                          currency === 'USD'
                            ? "bg-foreground text-background shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        title="Switch to US Dollar ($) - auto-converts amounts"
                      >
                        <span>$</span>
                        <span>USD</span>
                      </button>
                    </div>

                    <Button
                      variant={view === 'editor' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setView('editor')}
                      className="hidden md:flex gap-2 rounded-xl h-9"
                    >
                      <Receipt className="w-4 h-4" /> Editor
                    </Button>
                    <Button
                      variant={view === 'summary' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setView('summary')}
                      className="hidden md:flex gap-2 rounded-xl h-9"
                    >
                      <CreditCard className="w-4 h-4" /> Summary
                    </Button>
                    <BillConfiguration
                      people={people}
                      items={items}
                      hostId={hostId}
                      globalCharges={globalCharges}
                      billName={billName}
                      location={location}
                      setHostId={setHostId}
                      addGlobalCharge={addGlobalCharge}
                      updateGlobalCharge={updateGlobalCharge}
                      removeGlobalCharge={removeGlobalCharge}
                      setBillName={setBillName}
                      setLocation={setLocation}
                      updatePerson={updatePerson}
                      onSave={saveToDb}
                      qrCode={qrCode}
                      setQrCode={setQrCode}
                    />
                    <a
                      href="https://github.com/mudoker/bill-split"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View GitHub repository"
                      className="hidden sm:block"
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border-foreground/10 hover:bg-foreground/5"
                      >
                        <Github className="w-4 h-4" />
                      </Button>
                    </a>
                    <ModeToggle />
                  </div>
                </header>
              </div>

              <DiscrepancyBanner />

              {/* Main Content - Flex Grow */}
              <main className="flex-1 w-full mx-auto max-w-[94%] 2xl:max-w-[2000px] px-3 sm:px-6 md:px-8 lg:px-10 md:pt-0 overflow-hidden relative flex flex-col min-h-0">
                {/* Desktop Grid Layout */}
                <div className="hidden md:block h-full overflow-hidden">
                  {view === 'editor' ? (
                    <ResizableSplit
                      left={<PeopleSection />}
                      right={<ItemsSection />}
                      defaultLeftPercent={35}
                      minLeftPercent={22}
                      maxLeftPercent={50}
                    />
                  ) : (
                    <div className="h-full overflow-hidden max-w-5xl xl:max-w-6xl mx-auto w-full">
                      <SummarySection />
                    </div>
                  )}
                </div>

                {/* Mobile Tab Layout */}
                <div className="md:hidden flex-1 relative overflow-hidden flex flex-col pb-1 min-h-0">
                  <div className="flex-1 overflow-hidden h-full">
                    {mobileTab === 'people' && (
                      <div className="flex flex-col gap-4 h-full">
                        <div className="flex-1 overflow-hidden">
                          <PeopleSection />
                        </div>
                      </div>
                    )}
                    {mobileTab === 'items' && <ItemsSection />}
                    {mobileTab === 'summary' && <SummarySection />}
                  </div>
                </div>
              </main>

              {/* Mobile Bottom Nav */}
              <nav
                aria-label="Mobile Navigation"
                className="md:hidden flex-none bg-card/95 backdrop-blur-xl border-t border-foreground/10 select-none pb-[env(safe-area-inset-bottom)] shadow-lg z-30"
              >
                <div className="flex h-14 items-center justify-around px-2">
                  <button
                    type="button"
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 flex-1 py-1 px-2 rounded-xl transition-all relative touch-manipulation active:scale-95",
                      mobileTab === 'people'
                        ? "text-primary font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setMobileTab('people')}
                  >
                    <div className="relative">
                      <Users className="w-5 h-5" />
                      {people.length > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-foreground text-background text-[9px] font-black h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                          {people.length}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] tracking-tight">People</span>
                    {mobileTab === 'people' && (
                      <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 flex-1 py-1 px-2 rounded-xl transition-all relative touch-manipulation active:scale-95",
                      mobileTab === 'items'
                        ? "text-primary font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setMobileTab('items')}
                  >
                    <div className="relative">
                      <Receipt className="w-5 h-5" />
                      {items.length > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-foreground text-background text-[9px] font-black h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                          {items.length}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] tracking-tight">Items</span>
                    {mobileTab === 'items' && (
                      <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 flex-1 py-1 px-2 rounded-xl transition-all relative touch-manipulation active:scale-95",
                      mobileTab === 'summary'
                        ? "text-primary font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setMobileTab('summary')}
                  >
                    <div className="relative">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] tracking-tight">Summary</span>
                    {mobileTab === 'summary' && (
                      <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                </div>
              </nav>

              {/* Desktop Footer */}
              <footer className="hidden md:block mt-6 text-center text-xs text-muted-foreground shrink-0 pb-4">
                <p>Designed for easy splitting even with late arrivals & sponsors.</p>
              </footer>
          </>
        )}
      </div>
    </ThemeProvider>
  )
}

export default App
