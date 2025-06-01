import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// ---- packages/ui/Button.tsx ----
import { Button } from 'tamagui';
export const PrimaryButton = (props) => <Button {...props} />;

// ---- apps/web/app/page.tsx ----
'use client';
import { PrimaryButton } from '@ui/Button';
import { useQuery } from '@tanstack/react-query';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@utils/firebase';

export default function Home() {
  const fetchData = async () => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch('/api/sheet', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['sheet'],
    queryFn: fetchData,
    enabled: !!auth.currentUser,
  });

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  return (
    <main>
      <PrimaryButton onPress={login}>Sign In with Google</PrimaryButton>
      {isLoading ? <p>Loading...</p> : <pre>{JSON.stringify(data, null, 2)}</pre>}
    </main>
  );
}