import React, { useState } from 'react';
import LandingPage, { AppPage } from './Landing'; 

export default function App() {
  const [page, setPage] = useState('landing'); // 'landing' | 'app'

  if (page === 'app') {
    return <AppPage onBack={() => setPage('landing')} />;
  }
  return <LandingPage onTryFree={() => setPage('app')} />;
}