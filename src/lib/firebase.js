import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBSCxscPa2RZn-3UgA_L8d0xdr5S2i9Q1c",
  authDomain: "studyhub-e1f30.firebaseapp.com",
  projectId: "studyhub-e1f30",
  storageBucket: "studyhub-e1f30.firebasestorage.app",
  messagingSenderId: "343384331691",
  appId: "1:343384331691:web:8485284f254bd8285b2eee",
  measurementId: "G-C2GQKHDZ6D"
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const db = getFirestore(app)