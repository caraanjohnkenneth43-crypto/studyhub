// One-time script: pushes content.json data into Firestore
// Run with: node scripts/migrate-to-firebase.mjs

import { readFileSync } from "fs"
import { initializeApp } from "firebase/app"
import { getFirestore, doc, setDoc } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBSCxscPa2RZn-3UgA_L8d0xdr5S2i9Q1c",
  authDomain: "studyhub-e1f30.firebaseapp.com",
  projectId: "studyhub-e1f30",
  storageBucket: "studyhub-e1f30.firebasestorage.app",
  messagingSenderId: "343384331691",
  appId: "1:343384331691:web:8485284f254bd8285b2eee",
  measurementId: "G-C2GQKHDZ6D"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const data = JSON.parse(readFileSync("data/content.json", "utf-8"))

await setDoc(doc(db, "app", "data"), data)

console.log("Data migrated to Firestore successfully!")
console.log(`Subjects: ${data.subjects.length}`)
data.subjects.forEach((s) => {
  console.log(`  ${s.icon} ${s.name}: ${s.quizzes.length} quizzes, ${s.links.length} links`)
})

process.exit(0)