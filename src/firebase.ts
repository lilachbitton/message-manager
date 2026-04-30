import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyB4eWxIOPVe-mk_vop1eIu49j-JC8LBLbQ',
  authDomain: 'message-manager-66f4f.firebaseapp.com',
  projectId: 'message-manager-66f4f',
  storageBucket: 'message-manager-66f4f.firebasestorage.app',
  messagingSenderId: '454785858469',
  appId: '1:454785858469:web:a0d7f4f6f377342308064c',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Single shared workspace doc — entire team reads and writes to this one document
const WORKSPACE_PATH = 'workspaces/main';

export interface WorkspaceData {
  templates: any[];
  links: any[];
  challenge: any | null;
  updatedAt?: number;
  updatedBy?: string;
}

export function subscribeWorkspace(
  onChange: (data: WorkspaceData | null) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(doc(db, WORKSPACE_PATH), (snap) => {
    if (snap.exists()) {
      onChange(snap.data() as WorkspaceData);
    } else {
      onChange(null);
    }
  }, (err) => {
    console.error('Firestore subscription error:', err);
    if (onError) onError(err);
  });
}

export async function saveWorkspace(data: Partial<WorkspaceData>) {
  try {
    await setDoc(doc(db, WORKSPACE_PATH), {
      ...data,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (e: any) {
    console.error('Firestore save error:', e?.code, e?.message);
    throw e;
  }
}
