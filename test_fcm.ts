import { readFileSync } from 'fs';
import { GoogleAuth } from 'google-auth-library';
import * as dotenv from 'dotenv';
dotenv.config();

const FCM_SERVICE_ACCOUNT = process.env.FCM_SERVICE_ACCOUNT_JSON;

async function getFCMAccessToken() {
  if (!FCM_SERVICE_ACCOUNT) throw new Error('FCM_SERVICE_ACCOUNT_JSON is missing');
  let account;
  try {
    account = JSON.parse(FCM_SERVICE_ACCOUNT);
  } catch (e) {
    throw new Error('Invalid JSON format in FCM_SERVICE_ACCOUNT_JSON');
  }

  const auth = new GoogleAuth({
    credentials: {
      client_email: account.client_email,
      private_key: account.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });

  const token = await auth.getAccessToken();
  return token;
}

getFCMAccessToken().then(console.log).catch(console.error);
