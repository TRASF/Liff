<script>
	// Body element
	const body = document.getElementById('body')
	
	// Button elements
	const btnSend = document.getElementById("btnSend")
	const btnClose = document.getElementById("btnClose")
	const btnShare = document.getElementById("btnShare")
	const btnLogIn = document.getElementById("btnLogIn")
	const btnLogOut = document.getElementById("btnLogOut")
	const btnScanCode = document.getElementById("btnScanCode")
	const btnOpenWindow = document.getElementById("btnOpenWindow")
	
	// Profile elements
	const email = document.getElementById("email")
	const userId = document.getElementById("userId")
	const pictureUrl = document.getElementById("pictureUrl")
	const displayName = document.getElementById("displayName")
	const statusMessage = document.getElementById("statusMessage")
	
	// QR element
	const code = document.getElementById("code")
	const friendShip = document.getElementById("friendShip")
	
	async function main() {
	  // Initialize LIFF app)
	  await liff.init({liffId:"1657163335-3GLvEy0J"});
	  console.log("Pass");
	  switch(liff.getOS()){
		case 'andriod':
		  body.style.backgroundColor = "black";
		  break;
		case 'ios':
		  body.style.backgroundColor = "white";
		  break;
	  }
	  Getpro();
	  // Try a LIFF function
	}
	
	async function Getpro(){
	   const profile = await liff.getProfile();
	  pictureUrl.src = profile.pictureUrl;
	  userId.innerHTML = "<b>userId:</b> " + profile.userId;
	  statusMessage.innerHTML = "<b>statusMessage:</b> " + profile.statusMessage;
	  displayName.innerHTML = "<b>displayName:</b> " + profile.displayName;
	}
	main()
	
	</script>
	
	
	<!-- Import Script && -->
	<svelte:head>
	<script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
	<script src="https://unpkg.com/@stackblitz/sdk/bundles/sdk.umd.js"></script>
	</svelte:head>
	
	
	
	<!-- Body -->
	<body id="body">
	  <section id="profile">
		<img id="pictureUrl" src="https://mokmoon.com/images/ic_liff.png">
		<p id="userId"></p>
		<p id="displayName"></p>
		<p id="statusMessage"></p>
		<p id="status"></p>
	  </section>
	
	  <section id="feature">
	  </section>
	
	  <section id="button">
	  </section>
	</body>
	
	
	
	<!-- Style Css -->
	<style>
	body {
	  margin: 20px
	}
	
	button {
	  display: none;
	  width: 100%;
	  padding: 8px 0;
	  margin: 8px auto;
	  -moz-border-radius: 8px;
	  -webkit-border-radius: 8px;
	  border-radius: 8px;
	}
	
	p {
	  border-bottom: 1px dashed #ddd
	}
	
	#pictureUrl {
	  margin: 0 auto;
	  width: 32%;
	  display: -moz-box;
	  display: -webkit-box;
	  display: box;
	  -moz-box-pack: center;
	  -moz-box-align: center;
	  -webkit-box-pack: center;
	  -webkit-box-align: center;
	  box-pack: center;
	  box-align: center;
	  -moz-border-radius: 256px;
	  -webkit-border-radius: 256px;
	  border-radius: 256px;
	}
	
	#accessToken, #utouId {
	  display: block;
	  overflow: auto
	}
	</style>
	