const categories = [{"name":"test","icon":"\ud83c\udff7\ufe0f","color":"\ud83c\udff7\ufe0f","userId":6,"id":36}]
const user = {"id":6,"cognitoId":"33ac2a0a-5041-7006-9e3c-7e780e102f17","name":"giovani","email":"giovanisims@example.com","cpf":"00000000000"}

const userCategories = categories.filter(category => {
  const uId = 'userId' in category ? category.userId : category.UserId;
  const myId = 'id' in user ? user.id : user.Id;
  return String(uId) === String(myId);
})

console.log(userCategories)
