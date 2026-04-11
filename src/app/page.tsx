import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { HomePage } from '@/components/marketing/home-page';

export const metadata: Metadata = {
  title: 'todo4 — AI-native task management',
  description: 'Let your AI agent manage tasks while you stay in control. Built for teams that move fast and trust their tools.',
};

export default async function Home() {
  const cookieStore = await cookies();
  if (cookieStore.has('access_token')) {
    redirect('/tasks');
  }
  return <HomePage />;
}
