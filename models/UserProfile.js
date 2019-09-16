//used to store user details and user items in an object
function UserProfile(userId, userItems) {
	this.userId = userId;
	this.userItems = userItems;
}

module.exports = UserProfile;