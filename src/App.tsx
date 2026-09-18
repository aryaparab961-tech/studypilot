import React from 'react';
import { StudyPilotProvider, useStudyPilot } from './context/StudyPilotContext';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { StudyBuddyView } from './components/StudyBuddyView';
import { MyPlanView } from './components/MyPlanView';
import { MaterialsView } from './components/MaterialsView';
import { ProgressView } from './components/ProgressView';

const AppContent: React.FC = () => {
  const { activeTab } = useStudyPilot();

  return (
    <div
      id="studypilot-app-container"
      className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200"
    >
      {/* Top Main Navigation Header */}
      <Header />

      {/* Primary View based on Navigation Tab */}
      <main id="app-main-content" className="flex-1 overflow-y-auto">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'buddy' && <StudyBuddyView />}
        {activeTab === 'plan' && <MyPlanView />}
        {activeTab === 'materials' && <MaterialsView />}
        {activeTab === 'progress' && <ProgressView />}
      </main>
    </div>
  );
};

export function App() {
  return (
    <StudyPilotProvider>
      <AppContent />
    </StudyPilotProvider>
  );
}

export default App;
