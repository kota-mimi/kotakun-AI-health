// テスト用のLINE Webhook呼び出し
const testMessage = {
  "events": [
    {
      "type": "message",
      "replyToken": "test-reply-token",
      "source": {
        "userId": "U7fd12476d6263912e0d9c99fc3a6bef9",
        "type": "user"
      },
      "message": {
        "type": "text",
        "text": "こんにちは"
      }
    }
  ]
};

console.log('Testing LINE webhook with free user...');
console.log(JSON.stringify(testMessage, null, 2));

// 実際のAPI呼び出し
fetch('http://localhost:3000/api/webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-line-signature': 'test-signature'
  },
  body: JSON.stringify(testMessage)
})
.then(response => {
  console.log('Response status:', response.status);
  return response.text();
})
.then(data => {
  console.log('Response:', data);
})
.catch(error => {
  console.error('Error:', error);
});