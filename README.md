# Example of authentication server
> short info: openid-connect-provider in express.js that serves static files for interact endpoints

login

http://localhost:3000/auth?client_id=test_app&response_type=code&scope=openid%20email%20offline_access&redirect_uri=http://localhost:3000/callback

login with refresh token

http://localhost:3000/auth?client_id=test_app&response_type=code&scope=openid%20email%20offline_access&prompt=consent&redirect_uri=http://localhost:3000/callback
