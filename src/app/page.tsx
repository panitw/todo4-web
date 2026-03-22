import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect authenticated users to the tasks page.
  // Unauthenticated users are handled by auth middleware or the tasks page itself.
  redirect('/tasks');
}
