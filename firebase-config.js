/* =========================================================================
   firebase-config.js
   ↓↓↓ ここを「あなたの Firebase プロジェクトの値」に書きかえてください ↓↓↓
   （Firebase コンソール → プロジェクトの設定 → マイアプリ → 構成 でコピーできます）
   Realtime Database を使うので databaseURL が必要です。
   ========================================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyAGQAXl9Mkj0jLXFQ9itu0tHrHaTkk3spE",
  authDomain: "on-in-under-by.firebaseapp.com",
  databaseURL: "https://on-in-under-by-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "on-in-under-by",
  storageBucket: "on-in-under-by.firebasestorage.app",
  messagingSenderId: "870802633980",
  appId: "1:870802633980:web:c72f9b14bcb6fb2591d379"
};

/* ---- ここから下は変更不要 ---- */
let db = null, dbReady = false;
try {
  if (firebaseConfig.databaseURL && !firebaseConfig.databaseURL.includes("あなたの")) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    dbReady = true;
  }
} catch (e) { console.error(e); }
