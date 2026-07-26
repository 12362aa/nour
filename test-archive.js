
const https = require("https");
const ids = [
  "Riad_Alsalheen__AlDuraihim",
  "025-624-664_202203",
  "khaled_alridwany_028_201502",
  "40Nawawia",
  "qiraat-tafsir-saadi-arfaj",
  "Fiqh-Assunah",
  "022_20210927_202109",
  "MP3-------MADAREJ--ALSALEKEEN--MP3---BY--YA3QOOB",
  "Boulough_al-Maram",
  "Sharh_Zaad_Ma3ad",
  "ibnbaz-taf-ibnkatheer",
  "arafatbinhassan-Chamail_Almuhamadiy"
];

async function check() {
  for (const id of ids) {
    await new Promise(resolve => {
      https.get(`https://archive.org/metadata/${id}`, (res) => {
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (!json.metadata) {
              console.log(`${id}: NOT FOUND`);
            } else {
              const mp3s = json.files.filter(f => f.name.endsWith(".mp3"));
              console.log(`${id}: OK - Found ${mp3s.length} MP3 files`);
            }
          } catch(e) {
            console.log(`${id}: ERROR PARSING`);
          }
          resolve();
        });
      });
    });
  }
}
check();

