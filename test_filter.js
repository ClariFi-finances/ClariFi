const categories = [
  {
    "name": "test",
    "icon": "🏷️",
    "color": "🏷️",
    "userId": 6,
    "id": 36
  }
]
const user = { id: 6, cognitoId: "..." }

const filtered = categories.filter(category => {
  const uId = 'userId' in category ? category.userId : category.UserId;
  const myId = 'id' in user ? user.id : user.Id;
  return String(uId) === String(myId);
})

console.log(filtered)
