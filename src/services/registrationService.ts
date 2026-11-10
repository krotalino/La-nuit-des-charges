import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface RegistrationRecord {
  id?: string;
  nom: string;
  prenom: string;
  telephone: string;
  ville: string;
  passId: string;
  createdAt: string;
}

const COLLECTION_NAME = 'registrations';

/**
 * Saves a new RSVP registration to Firestore.
 */
export async function saveRegistration(record: Omit<RegistrationRecord, 'id'>): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      nom: record.nom,
      prenom: record.prenom,
      telephone: record.telephone,
      ville: record.ville,
      passId: record.passId,
      createdAt: record.createdAt || new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    } catch {
      // Logged and handled
    }
    return null;
  }
}

/**
 * Subscribes to the list of registrations in real-time.
 */
export function subscribeToRegistrations(
  onData: (data: RegistrationRecord[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: RegistrationRecord[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<RegistrationRecord, 'id'>),
        }));
        onData(list);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
        } catch (e) {
          if (onError && e instanceof Error) onError(e);
        }
      }
    );
  } catch (error) {
    if (onError && error instanceof Error) onError(error);
    return () => {};
  }
}

/**
 * Export registrations list to a formatted CSV file.
 */
export function exportToCSV(registrations: RegistrationRecord[]) {
  if (registrations.length === 0) return;

  const headers = ['Nom', 'Prénom', 'Téléphone WhatsApp', 'Ville', 'Numéro de Pass', 'Date d\'inscription'];
  const rows = registrations.map((r) => [
    `"${r.nom.replace(/"/g, '""')}"`,
    `"${r.prenom.replace(/"/g, '""')}"`,
    `"${r.telephone.replace(/"/g, '""')}"`,
    `"${r.ville.replace(/"/g, '""')}"`,
    `"${r.passId.replace(/"/g, '""')}"`,
    `"${r.createdAt}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Inscriptions-La-Nuit-Des-Charges-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
