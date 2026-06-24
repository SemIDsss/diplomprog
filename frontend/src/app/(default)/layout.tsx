import DefaultHeader from '@/components/DefaultHeader';

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DefaultHeader />
      <main className="flex-1 w-full pt-16 pb-16 lg:pb-0">
        {children}
      </main>
    </>
  );
}