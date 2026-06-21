import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileTabBar from './MobileTabBar';
import Breadcrumb from './Breadcrumb';
import AITermsGlossary from './AITermsGlossary';
import NetworkStatus from './NetworkStatus';
import NewUserGuide from './NewUserGuide';
import KeyboardShortcuts from './KeyboardShortcuts';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  noPadding?: boolean;
  showBreadcrumb?: boolean;
}

export default function Layout({ children, showFooter = true, noPadding = false, showBreadcrumb = true }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <NetworkStatus />
      <Header />
      {showBreadcrumb && <Breadcrumb />}
      <main className={`flex-1 ${noPadding ? '' : 'pb-20 md:pb-0'}`}>{children}</main>
      {showFooter && (
        <div className="hidden md:block">
          <Footer />
        </div>
      )}
      <MobileTabBar />
      <AITermsGlossary />
      <NewUserGuide />
      <KeyboardShortcuts />
    </div>
  );
}
