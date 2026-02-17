import { useState } from 'react';
import { ItemsSection } from "@/components/items/items-section";
import { PeopleSection } from "@/components/people/people-section";
import { SummarySection } from "@/components/summary/summary-section";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Calculator, Users, Receipt, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function App() {
  const [mobileTab, setMobileTab] = useState<'people' | 'items' | 'summary'>('items');

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background/50 backdrop-blur-3xl font-sans text-foreground antialiased selection:bg-primary/20 flex flex-col items-stretch h-screen overflow-hidden supports-[height:100dvh]:h-[100dvh]">

        {/* Header - Fixed */}
        <div className="flex-none p-4 md:p-8 md:pb-0 container mx-auto max-w-7xl w-full">
          <header className="flex justify-between items-center mb-4 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
                <Calculator className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  WeSplit
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">Smart Bill Splitting with Sponsors</p>
              </div>
            </div>
            <ModeToggle />
          </header>
        </div>

        {/* Main Content - Flex Grow */}
        <main className="flex-1 w-full mx-auto container max-w-7xl md:p-8 md:pt-0 overflow-hidden relative flex flex-col">
          {/* Desktop Grid Layout */}
          <div className="hidden md:grid md:grid-cols-12 gap-6 h-full">
            {/* Left Column: People & Config (4 cols) */}
            <div className="md:col-span-4 h-full overflow-hidden flex flex-col gap-4">
              <PeopleSection />
            </div>

            {/* Middle Column: Items (4 cols) */}
            <div className="md:col-span-4 h-full overflow-hidden flex flex-col">
              <ItemsSection />
            </div>

            {/* Right Column: Summary (4 cols) */}
            <div className="md:col-span-4 h-full overflow-hidden flex flex-col">
              <SummarySection />
            </div>
          </div>

          {/* Mobile Tab Layout */}
          <div className="md:hidden flex-1 relative overflow-hidden flex flex-col px-4 pb-2">
            <div className="flex-1 overflow-hidden h-full">
              {mobileTab === 'people' && <PeopleSection />}
              {mobileTab === 'items' && <ItemsSection />}
              {mobileTab === 'summary' && <SummarySection />}
            </div>
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden flex-none bg-card border-t flex items-center justify-around h-16 px-4 pb-1">
          <Button
            variant="ghost"
            className={cn("flex flex-col items-center gap-1 h-auto py-2 px-4 rounded-xl transition-all", mobileTab === 'people' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary")}
            onClick={() => setMobileTab('people')}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">People</span>
          </Button>
          <Button
            variant="ghost"
            className={cn("flex flex-col items-center gap-1 h-auto py-2 px-4 rounded-xl transition-all", mobileTab === 'items' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary")}
            onClick={() => setMobileTab('items')}
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[10px] font-medium">Items</span>
          </Button>
          <Button
            variant="ghost"
            className={cn("flex flex-col items-center gap-1 h-auto py-2 px-4 rounded-xl transition-all", mobileTab === 'summary' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary")}
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
      </div>
    </ThemeProvider>
  )
}

export default App
