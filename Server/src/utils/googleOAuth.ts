import axios from "axios";

interface GoogleTokenResponse {
  id_token: string;
  access_token: string;
}

interface GoogleUserInfo {
  email: string;
  given_name: string;
  family_name: string;
  email_verified: boolean;
}

export const exchangeGoogleCode = async (code: string): Promise<GoogleTokenResponse> => {
  const url = "https://oauth2.googleapis.com/token";
  const values = new URLSearchParams({
    code,
    client_id: process.env.CLIENT_ID ?? "",
    client_secret: process.env.CLIENT_SECRET ?? "",
    redirect_uri: process.env.REDIRECT_URL ?? "",
    grant_type: "authorization_code",
  });

  const res = await axios.post<GoogleTokenResponse>(url, values.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data;
};

export const getGoogleUser = async (idToken: string, accessToken: string): Promise<GoogleUserInfo> => {
  const res = await axios.get<GoogleUserInfo>(
    `https://www.googleapis.com/oauth2/v3/userinfo?alt=json&access_token=${accessToken}`,
    { headers: { Authorization: `Bearer ${idToken}` } }
  );
  return res.data;
};
