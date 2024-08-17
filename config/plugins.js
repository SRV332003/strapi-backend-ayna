module.exports = () => ({
	io: {
		enabled: true,
		config: {
			// This will listen for all supported events on the article content type
			contentTypes: ['api::users-permissions.user'],
		},
	},

});