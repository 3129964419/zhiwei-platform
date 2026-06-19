import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileTabBar from './MobileTabBar';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  noPadding?: boolean;
}

export default function Layout({ children, showFooter = true, noPadding = false }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className={`flex-1 ${noPadding ? '' : 'pb-20 md:pb-0'}`}>{children}</main>
      {showFooter && (
        <div className="hidden md:block">
          <Footer />
        </div>
      )}
      <MobileTabBar />
    </div>
  );
}
