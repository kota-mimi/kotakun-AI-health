const userId = "U7fd12476d6263912e0d9c99fc3a6bef9";

async function resetUser() {
  try {
    console.log(`🔥 ユーザー ${userId} の完全リセット開始...`);
    
    const response = await fetch("http://localhost:3000/api/complete-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    
    const text = await response.text();
    
    if (response.ok) {
      console.log("✅ リセット成功:", text);
    } else {
      console.log("Response status:", response.status);
      console.log("Response text:", text);
    }
  } catch (error) {
    console.error("❌ エラー:", error);
  }
}

resetUser();
