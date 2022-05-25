var ghpages = require("gh-pages");

ghpages.publish(
  "public", // path to public directory
  {
    branch: "gh-pages",
    repo: "https://github.com/TRASF/Liff.git", // Update to point to your repository
    user: {
      name: "TRASF", // update to use your name
      email: "thantamrong28@gmail.com", // Update to use your email
    },
  },
  () => {
    console.log("Deploy Complete!");
  }
);
