'use client';

import { useState, useEffect } from 'react';
import { ItemsSection } from "@/components/items/items-section";
import { PeopleSection } from "@/components/people/people-section";
import { SummarySection } from "@/components/summary/summary-section";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Users, Receipt, CreditCard, ArrowLeft, MapPin } from "lucide-react";
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
    setQrCode
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
      <div className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-foreground/20 flex flex-col items-stretch h-screen overflow-hidden supports-[height:100dvh]:h-[100dvh]">

        {view === 'landing' ? (
          <>
            <div className="flex-none p-4 md:p-8 md:pb-0 container mx-auto max-w-7xl w-full">
              <header className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-foreground rounded-xl shadow-lg shadow-black/10">
                    <AppLogo className="w-6 h-6 text-background" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Bill Split
                  </h1>
                </div>
                <ModeToggle />
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
              <div className="bg-foreground/5 border-b border-foreground/10 py-2.5 px-4 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-300 flex-none">
                <Eye className="w-4 h-4 text-foreground/60" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">View-only Mode - Changes are disabled</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] ml-4 hover:bg-foreground/5"
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

              {/* Header - Fixed */}
              <div className="flex-none p-4 md:p-8 md:pb-0 container mx-auto max-w-7xl w-full">
                <header className="flex justify-between items-center mb-4 md:mb-8">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleBackToLanding} className="rounded-xl">
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary rounded-2xl shadow-xl shadow-primary/20 shrink-0">
                        <AppLogo className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                            {billName || "Untitled Bill"}
                          </h1>
                          <span className="text-[9px] text-primary border border-primary/20 uppercase font-black tracking-[0.2em] bg-primary/5 px-2 py-0.5 rounded-full shrink-0">
                            {currentBillId ? `SESSION ${currentBillId.slice(0, 8)}` : "LIVE SESSION"}
                          </span>
                        </div>
                        {location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium truncate mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                            <span className="truncate">{location}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <ModeToggle />
                  </div>
                </header>
              </div>

              <DiscrepancyBanner />

              {/* Main Content - Flex Grow */}
              <main className="flex-1 w-full mx-auto container max-w-7xl md:p-8 md:pt-0 overflow-hidden relative flex flex-col">
                {/* Desktop Grid Layout */}
                <div className="hidden md:block h-full overflow-hidden">
                  {view === 'editor' ? (
                    <ResizableSplit
                      left={<PeopleSection />}
                      right={<ItemsSection />}
                      defaultLeftPercent={38}
                      minLeftPercent={25}
                      maxLeftPercent={55}
                    />
                  ) : (
                    <div className="h-full overflow-hidden max-w-4xl mx-auto w-full">
                      <SummarySection />
                    </div>
                  )}
                </div>

                {/* Mobile Tab Layout */}
                <div className="md:hidden flex-1 relative overflow-hidden flex flex-col px-4 pb-2">
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
              <div className="md:hidden flex-none bg-card border-t flex items-center justify-around h-16 px-4 pb-1">
                <Button
                  variant="ghost"
                  className={cn("flex flex-col items-center gap-1 h-auto py-2 px-4 rounded-xl transition-all", mobileTab === 'people' ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground")}
                  onClick={() => setMobileTab('people')}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-[10px] font-medium">People</span>
                </Button>
                <Button
                  variant="ghost"
                  className={cn("flex flex-col items-center gap-1 h-auto py-2 px-4 rounded-xl transition-all", mobileTab === 'items' ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground")}
                  onClick={() => setMobileTab('items')}
                >
                  <Receipt className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Items</span>
                </Button>
                <Button
                  variant="ghost"
                  className={cn("flex flex-col items-center gap-1 h-auto py-2 px-4 rounded-xl transition-all", mobileTab === 'summary' ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground")}
                  onClick={() => setMobileTab('summary')}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Summary</span>
                </Button>
              </div>

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
