
const https = require("https");
https.get("https://archive.org/advancedsearch.php?q=title:(ÞÑÇÁÉ+ÊÝÓíÑ+ÇáÓÚÏí)&fl[]=identifier,title,format&rows=5&output=json", (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    try {
      const json = JSON.parse(data);
      console.log(json.response.docs);
    } catch(e) { console.log(e); }
  });
});

