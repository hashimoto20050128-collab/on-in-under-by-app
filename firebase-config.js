/* =========================================================================
   firebase-config.js
   ↓↓↓ ここを「あなたの Firebase プロジェクトの値」に書きかえてください ↓↓↓
   （Firebase コンソール → プロジェクトの設定 → マイアプリ → 構成 でコピーできます）
   Realtime Database を使うので databaseURL が必要です。
   ========================================================================= */
const firebaseConfig = {
  apiKey:            "ここにAPIキー",
  authDomain:        "あなたのプロジェクト.firebaseapp.com",
  databaseURL:       "https://あなたのプロジェクト-default-rtdb.firebasedatabase.app",
  projectId:         "あなたのプロジェクト",
  storageBucket:     "あなたのプロジェクト.appspot.com",
  messagingSenderId: "000000000000",
  appId:             "1:000000000000:web:xxxxxxxxxxxx"
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
