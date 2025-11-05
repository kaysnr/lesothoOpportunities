// scripts/setAdmin.js
const admin = require("firebase-admin");

// Use your Firebase service account key
const serviceAccount = require("C:/Users/Administrator/Documents/webDesign/Lesotho_Opportunites/lesothoapp/src/lesotho-opportunities-firebase-adminsdk-fbsvc-b8f50641f0.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://lesotho-opportunities-default-rtdb.firebaseio.com"
});

// Set custom claim
const setAdmin = async (email) => {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ Admin role granted to ${email}`);
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

// Run script
setAdmin("admin@gmail.com");
